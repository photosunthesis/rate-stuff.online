import {
	ratings,
	ratingsToTags,
	tags,
	stuff,
	users,
	ratingVotes,
} from "~/db/schema/";
import { and, isNull, desc, lt, eq, gte, sql, or, exists } from "drizzle-orm";
import { createServerOnlyFn } from "@tanstack/react-start";
import type { RatingWithRelations } from "../types/display";
import { getDatabase } from "~/db";

function transformToGroupedRating(row: {
	rating: typeof ratings.$inferSelect;
	stuff: typeof stuff.$inferSelect | null;
	user: {
		id: string;
		name: string | null;
		username: string | null;
		image: string | null;
	} | null;
	tags: string[];
	userVote: "up" | "down" | null;
}): RatingWithRelations {
	return {
		...row.rating,
		stuff: row.stuff,
		user: row.user,
		tags: row.tags,
		userVote: row.userVote,
	};
}

function getRatingsSelection(viewerId?: string) {
	return {
		rating: ratings,
		stuff: stuff,
		user: {
			id: users.id,
			name: users.name,
			username: users.username,
			image: users.image,
		},
		tags: sql<
			string[]
		>`coalesce(json_agg(${tags.name} order by ${tags.name}) filter (where ${tags.name} is not null), '[]')`,
		userVote: viewerId
			? sql<
					"up" | "down" | null
				>`(select ${ratingVotes.type} from ${ratingVotes} where ${ratingVotes.ratingId} = ${ratings.id} and ${ratingVotes.userId} = ${viewerId})`
			: sql<null>`null`,
	};
}

export const getUserRatings = createServerOnlyFn(
	async (
		userId: string,
		limit = 10,
		cursor?: { createdAt: Date; id: string },
		viewerId?: string,
	) => {
		const cursorFilter = cursor
			? or(
					lt(ratings.createdAt, cursor.createdAt),
					and(
						eq(ratings.createdAt, cursor.createdAt),
						lt(ratings.id, cursor.id),
					),
				)
			: undefined;

		const db = getDatabase();

		const results = await db
			.select(getRatingsSelection(viewerId))
			.from(ratings)
			.leftJoin(stuff, eq(ratings.stuffId, stuff.id))
			.leftJoin(users, eq(ratings.userId, users.id))
			.leftJoin(ratingsToTags, eq(ratings.id, ratingsToTags.ratingId))
			.leftJoin(tags, eq(ratingsToTags.tagId, tags.id))
			.where(
				and(
					eq(ratings.userId, userId),
					isNull(ratings.deletedAt),
					cursorFilter,
				),
			)
			.groupBy(ratings.id, stuff.id, users.id)
			.orderBy(desc(ratings.createdAt), desc(ratings.id))
			.limit(limit);

		return results.map(transformToGroupedRating);
	},
);

export const getFeedRatings = createServerOnlyFn(
	async (
		limit = 10,
		cursor?: { createdAt: Date; id: string },
		filterTag?: string,
		viewerId?: string,
	) => {
		const cursorFilter = cursor
			? or(
					lt(ratings.createdAt, cursor.createdAt),
					and(
						eq(ratings.createdAt, cursor.createdAt),
						lt(ratings.id, cursor.id),
					),
				)
			: undefined;

		const db = getDatabase();

		const tagFilter = filterTag
			? exists(
					db
						.select({ id: ratingsToTags.tagId })
						.from(ratingsToTags)
						.innerJoin(tags, eq(ratingsToTags.tagId, tags.id))
						.where(
							and(
								eq(ratingsToTags.ratingId, ratings.id),
								eq(tags.name, filterTag),
							),
						),
				)
			: undefined;

		const results = await db
			.select(getRatingsSelection(viewerId))
			.from(ratings)
			.leftJoin(stuff, eq(ratings.stuffId, stuff.id))
			.leftJoin(users, eq(ratings.userId, users.id))
			.leftJoin(ratingsToTags, eq(ratings.id, ratingsToTags.ratingId))
			.leftJoin(tags, eq(ratingsToTags.tagId, tags.id))
			.where(and(isNull(ratings.deletedAt), cursorFilter, tagFilter))
			.groupBy(ratings.id, stuff.id, users.id)
			.orderBy(desc(ratings.createdAt), desc(ratings.id))
			.limit(limit);

		return results.map(transformToGroupedRating);
	},
);

export const getRatingById = createServerOnlyFn(
	async (id: string, viewerId?: string) => {
		const db = getDatabase();

		const results = await db
			.select(getRatingsSelection(viewerId))
			.from(ratings)
			.leftJoin(stuff, eq(ratings.stuffId, stuff.id))
			.leftJoin(users, eq(ratings.userId, users.id))
			.leftJoin(ratingsToTags, eq(ratings.id, ratingsToTags.ratingId))
			.leftJoin(tags, eq(ratingsToTags.tagId, tags.id))
			.where(and(eq(ratings.id, id), isNull(ratings.deletedAt)))
			.groupBy(ratings.id, stuff.id, users.id)
			.limit(1);

		const row = results[0];
		return row ? transformToGroupedRating(row) : null;
	},
);

export const getRecentTags = createServerOnlyFn(async (limit = 10) => {
	const db = getDatabase();
	const now = Date.now();
	const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
	const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
	const yearAgo = new Date(now - 365 * 24 * 60 * 60 * 1000);

	const timeRanges = [weekAgo, monthAgo, yearAgo, null];

	for (const range of timeRanges) {
		const timeFilter = range ? gte(ratings.createdAt, range) : undefined;

		const rows = await db
			.select({
				name: tags.name,
				count: sql<number>`count(${ratingsToTags.ratingId})`,
			})
			.from(ratingsToTags)
			.innerJoin(tags, eq(tags.id, ratingsToTags.tagId))
			.innerJoin(ratings, eq(ratings.id, ratingsToTags.ratingId))
			.where(and(isNull(ratings.deletedAt), timeFilter))
			.groupBy(tags.name)
			.orderBy(desc(sql`count(${ratingsToTags.ratingId})`))
			.limit(limit);

		if (rows.length > 0) {
			return rows.map((r) => ({ name: r.name, count: Number(r.count) }));
		}
	}

	return [];
});

export const getRecentStuff = createServerOnlyFn(async (limit = 5) => {
	const db = getDatabase();
	const now = Date.now();
	const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
	const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
	const yearAgo = new Date(now - 365 * 24 * 60 * 60 * 1000);

	const timeRanges = [weekAgo, monthAgo, yearAgo, null];

	for (const range of timeRanges) {
		const timeFilter = range ? gte(ratings.createdAt, range) : undefined;

		const rows = await db
			.select({
				id: stuff.id,
				name: stuff.name,
				slug: stuff.slug,
				count: sql<number>`count(${ratings.id})`,
			})
			.from(ratings)
			.innerJoin(stuff, eq(stuff.id, ratings.stuffId))
			.where(and(isNull(ratings.deletedAt), timeFilter))
			.groupBy(stuff.id, stuff.name, stuff.slug)
			.orderBy(desc(sql`count(${ratings.id})`))
			.limit(limit);

		if (rows.length > 0) {
			return rows.map((r) => ({
				id: r.id,
				slug: r.slug,
				name: r.name,
				count: Number(r.count),
			}));
		}
	}

	return [];
});

export const getUserRatingsCount = createServerOnlyFn(
	async (userId: string) => {
		const db = getDatabase();

		const [row] = await db
			.select({ count: sql<number>`count(*)` })
			.from(ratings)
			.where(and(eq(ratings.userId, userId), isNull(ratings.deletedAt)));

		return Number(row?.count ?? 0);
	},
);
