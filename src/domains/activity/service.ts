import { getDatabase } from "~/db";
import { activities, comments, users } from "~/db/schema";
import { eq, desc, and, count, or, lt, isNull } from "drizzle-orm";
import { createServerOnlyFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

type Transaction = Parameters<
	Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]
>[0];

export const createActivity = createServerOnlyFn(
	async (
		tx: Transaction,
		input: {
			userId: string;
			actorId: string;
			type: "rating_vote" | "comment_vote" | "comment_create";
			entityId: string;
			entityType: "rating" | "comment";
			metadata?: Record<string, unknown>;
		},
	) => {
		if (input.userId === input.actorId) return;

		await tx.insert(activities).values({
			userId: input.userId,
			actorId: input.actorId,
			type: input.type,
			entityId: input.entityId,
			entityType: input.entityType,
			metadata: input.metadata,
		});

		try {
			const id = env.ACTIVITY_NOTIFICATIONS.idFromName(`user-${input.userId}`);
			const stub = env.ACTIVITY_NOTIFICATIONS.get(id);
			stub
				.fetch(
					new Request("https://do/broadcast", {
						method: "POST",
						body: JSON.stringify({ message: "NEW_ACTIVITY" }),
					}),
				)
				.catch(() => {});
		} catch (_) {}
	},
);

export const getActivities = createServerOnlyFn(
	async (
		userId: string,
		limit: number,
		cursor?: { createdAt: Date; id: string },
	) => {
		const db = getDatabase();

		const cursorFilter = cursor
			? or(
					lt(activities.createdAt, cursor.createdAt),
					and(
						eq(activities.createdAt, cursor.createdAt),
						lt(activities.id, cursor.id),
					),
				)
			: undefined;

		const rows = await db
			.select({
				activity: activities,
				actor: {
					name: users.name,
					username: users.username,
					image: users.image,
				},
				commentRatingId: comments.ratingId,
				commentContent: comments.content,
			})
			.from(activities)
			.leftJoin(users, eq(activities.actorId, users.id))
			.leftJoin(
				comments,
				and(
					eq(activities.entityId, comments.id),
					eq(activities.entityType, "comment"),
				),
			)
			.where(
				and(
					eq(activities.userId, userId),
					isNull(activities.deletedAt),
					cursorFilter ? cursorFilter : undefined,
				),
			)
			.orderBy(desc(activities.createdAt), desc(activities.id))
			.limit(limit + 1);

		const hasNextPage = rows.length > limit;
		const items = hasNextPage ? rows.slice(0, limit) : rows;

		const result = items.map((row) => ({
			...row.activity,
			actor: row.actor,
			targetRatingId:
				row.activity.entityType === "rating"
					? row.activity.entityId
					: row.commentRatingId,
			commentContent:
				(row.activity.metadata as { preview?: string })?.preview ??
				row.commentContent,
		}));

		const nextCursor =
			hasNextPage && result.length > 0
				? {
						createdAt: result[result.length - 1].createdAt,
						id: result[result.length - 1].id,
					}
				: null;

		return {
			items: result,
			nextCursor,
		};
	},
);

export const getUnreadCount = createServerOnlyFn(async (userId: string) => {
	const db = getDatabase();
	const [result] = await db
		.select({ count: count() })
		.from(activities)
		.where(
			and(
				eq(activities.userId, userId),
				eq(activities.isRead, false),
				isNull(activities.deletedAt),
			),
		);
	return result?.count ?? 0;
});

export const markActivitiesAsRead = createServerOnlyFn(
	async (userId: string) => {
		const db = getDatabase();
		await db
			.update(activities)
			.set({ isRead: true, readAt: new Date() })
			.where(and(eq(activities.userId, userId), eq(activities.isRead, false)));
	},
);

export const markActivityAsRead = createServerOnlyFn(
	async (userId: string, activityId: string) => {
		const db = getDatabase();
		await db
			.update(activities)
			.set({ isRead: true, readAt: new Date() })
			.where(
				and(
					eq(activities.userId, userId),
					eq(activities.id, activityId),
					eq(activities.isRead, false),
				),
			);
	},
);
