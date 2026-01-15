import { ratings, ratingsToTags, tags, stuff, users } from "~/db/schema/";
import { and, isNull, desc, lt, eq, gte, sql, or } from "drizzle-orm";
import { createServerOnlyFn } from "@tanstack/react-start";
import { db } from "~/db";
import type { drizzle } from "drizzle-orm/postgres-js";

type GroupedRating = typeof ratings.$inferSelect & {
	stuff: typeof stuff.$inferSelect | null;
	user: {
		id: string;
		name: string | null;
		username: string | null;
		image: string | null;
	} | null;
	tags: string[];
};

function groupRatingResults(
	results: Array<{
		rating: typeof ratings.$inferSelect;
		stuff: typeof stuff.$inferSelect | null;
		user: {
			id: string;
			name: string | null;
			username: string | null;
			image: string | null;
		} | null;
		tagName: string | null;
	}>,
): GroupedRating[] {
	const grouped = results.reduce(
		(acc, row) => {
			const ratingId = row.rating.id;
			if (!acc[ratingId]) {
				acc[ratingId] = {
					...row.rating,
					stuff: row.stuff,
					user: row.user,
					tags: [] as string[],
				};
			}
			if (row.tagName) {
				acc[ratingId].tags.push(row.tagName);
			}
			return acc;
		},
		{} as Record<string, GroupedRating>,
	);

	return Object.values(grouped);
}

async function queryRatingsWithRelations(
	db: ReturnType<typeof drizzle>,
	whereConditions: ReturnType<typeof and>,
	limit: number,
	orderBy: [ReturnType<typeof desc>, ReturnType<typeof desc>] = [
		desc(ratings.createdAt),
		desc(ratings.id),
	],
) {
	return await db
		.select({
			rating: ratings,
			stuff: stuff,
			user: {
				id: users.id,
				name: users.name,
				username: users.username,
				image: users.image,
			},
			tagName: tags.name,
		})
		.from(ratings)
		.leftJoin(stuff, eq(ratings.stuffId, stuff.id))
		.leftJoin(users, eq(ratings.userId, users.id))
		.leftJoin(ratingsToTags, eq(ratings.id, ratingsToTags.ratingId))
		.leftJoin(tags, eq(ratingsToTags.tagId, tags.id))
		.where(whereConditions)
		.orderBy(...orderBy)
		.limit(limit);
}

export const getUserRatings = createServerOnlyFn(
	async (
		userId: string,
		limit = 10,
		cursor?: { createdAt: Date; id: string },
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

		const results = await queryRatingsWithRelations(
			db,
			and(eq(ratings.userId, userId), isNull(ratings.deletedAt), cursorFilter),
			limit,
		);

		return groupRatingResults(results);
	},
);

export const getFeedRatings = createServerOnlyFn(
	async (
		limit = 10,
		cursor?: { createdAt: Date; id: string },
		tag?: string,
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

		// When a tag is provided, first find the rating IDs that match the tag
		// (respecting cursor and limit). Then fetch full relations for those
		// ratings so we return all tags for each rating.
		if (tag) {
			const matchingRows = await db
				.select({ id: ratings.id })
				.from(ratings)
				.leftJoin(ratingsToTags, eq(ratings.id, ratingsToTags.ratingId))
				.leftJoin(tags, eq(tags.id, ratingsToTags.tagId))
				.where(and(isNull(ratings.deletedAt), cursorFilter, eq(tags.name, tag)))
				.orderBy(desc(ratings.createdAt), desc(ratings.id))
				.limit(limit);

			const ratingIds = matchingRows.map((r) => r.id);
			if (ratingIds.length === 0) return [];

			// build an OR filter for the selected ids
			const idFilter = or(...ratingIds.map((id) => eq(ratings.id, id)));

			const results = await queryRatingsWithRelations(
				db,
				and(isNull(ratings.deletedAt), idFilter),
				limit * 10,
			);

			let grouped = groupRatingResults(results);

			// preserve ordering based on the ids we selected earlier
			grouped = ratingIds
				.map((id) => grouped.find((g) => g.id === id))
				.filter(Boolean) as GroupedRating[];

			return grouped.slice(0, limit);
		}

		const results = await queryRatingsWithRelations(
			db,
			and(isNull(ratings.deletedAt), cursorFilter),
			limit,
		);

		return groupRatingResults(results);
	},
);

export const getRatingById = createServerOnlyFn(async (id: string) => {
	const results = await queryRatingsWithRelations(
		db,
		and(eq(ratings.id, id)),
		1,
	);

	const grouped = groupRatingResults(results);
	return grouped.length > 0 ? grouped[0] : null;
});

export const getRecentTags = createServerOnlyFn(async (limit = 10) => {
	const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
	const rows = await db
		.select({ name: tags.name, count: sql<number>`COUNT(*)` })
		.from(ratingsToTags)
		.leftJoin(ratings, eq(ratings.id, ratingsToTags.ratingId))
		.leftJoin(tags, eq(tags.id, ratingsToTags.tagId))
		.where(and(isNull(ratings.deletedAt), gte(ratings.createdAt, weekAgo)))
		.groupBy(tags.name)
		.orderBy(sql`COUNT(*) DESC`)
		.limit(limit);

	return rows.map((r) => ({ name: r.name, count: Number(r.count) }));
});

export const getRecentStuff = createServerOnlyFn(async (limit = 5) => {
	const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
	const rows = await db
		.select({
			id: stuff.id,
			name: stuff.name,
			count: sql<number>`COUNT(*)`,
			slug: stuff.slug,
		})
		.from(ratings)
		.leftJoin(stuff, eq(stuff.id, ratings.stuffId))
		.where(and(isNull(ratings.deletedAt), gte(ratings.createdAt, weekAgo)))
		.groupBy(stuff.id, stuff.name, stuff.slug)
		.orderBy(sql`COUNT(*) DESC`)
		.limit(limit);

	return rows.map((r) => ({
		id: r.id,
		slug: r.slug,
		name: r.name,
		count: Number(r.count),
	}));
});

export const getUserRatingsCount = createServerOnlyFn(
	async (userId: string) => {
		const row = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(ratings)
			.where(and(eq(ratings.userId, userId), isNull(ratings.deletedAt)));

		if (!row || row.length === 0) return 0;

		return Number(row[0].count);
	},
);
