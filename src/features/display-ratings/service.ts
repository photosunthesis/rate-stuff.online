import { getDb } from "~/db/index";
import { env } from "cloudflare:workers";
import { ratings, ratingsToTags, tags, stuff, users } from "~/db/schema";
import { and, isNull, desc, lt, eq, gte, sql, or } from "drizzle-orm";

type GroupedRating = typeof ratings.$inferSelect & {
	stuff: typeof stuff.$inferSelect | null;
	user: {
		id: string;
		name: string | null;
		username: string;
		avatarUrl: string | null;
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
			username: string;
			avatarUrl: string | null;
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
	whereConditions: ReturnType<typeof and>,
	limit: number,
	orderBy: [ReturnType<typeof desc>, ReturnType<typeof desc>] = [
		desc(ratings.createdAt),
		desc(ratings.id),
	],
) {
	const db = getDb(env);

	return await db
		.select({
			rating: ratings,
			stuff: stuff,
			user: {
				id: users.id,
				name: users.name,
				username: users.username,
				avatarUrl: users.avatarUrl,
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

export async function getUserRatings(
	userId: string,
	limit = 10,
	cursor?: { createdAt: Date; id: string },
) {
	const cursorFilter = cursor
		? or(
				lt(ratings.createdAt, cursor.createdAt),
				and(eq(ratings.createdAt, cursor.createdAt), lt(ratings.id, cursor.id)),
			)
		: undefined;

	const results = await queryRatingsWithRelations(
		and(eq(ratings.userId, userId), isNull(ratings.deletedAt), cursorFilter),
		limit,
	);

	return groupRatingResults(results);
}

export async function getFeedRatings(
	limit = 10,
	cursor?: { createdAt: Date; id: string },
	tag?: string,
) {
	const cursorFilter = cursor
		? or(
				lt(ratings.createdAt, cursor.createdAt),
				and(eq(ratings.createdAt, cursor.createdAt), lt(ratings.id, cursor.id)),
			)
		: undefined;

	const tagFilter = tag ? eq(tags.name, tag) : undefined;

	const results = await queryRatingsWithRelations(
		and(isNull(ratings.deletedAt), cursorFilter, tagFilter),
		limit,
	);

	const grouped = groupRatingResults(results);

	if (tag) {
		return grouped.filter((r) => r.tags.includes(tag)).slice(0, limit);
	}

	return grouped;
}

export async function getRatingById(id: string) {
	const results = await queryRatingsWithRelations(and(eq(ratings.id, id)), 1);

	const grouped = groupRatingResults(results);
	return grouped.length > 0 ? grouped[0] : null;
}

export async function getRatingBySlug(slug: string) {
	const results = await queryRatingsWithRelations(
		and(eq(ratings.slug, slug)),
		1,
	);

	const grouped = groupRatingResults(results);

	return grouped.length > 0 ? grouped[0] : null;
}

export async function getRecentTags(limit = 10) {
	const db = getDb(env);
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
}

export async function getRecentStuff(limit = 5) {
	const db = getDb(env);
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
}

export async function getUserRatingsCount(userId: string) {
	const db = getDb(env);
	const row = await db
		.select({ count: sql<number>`COUNT(*)` })
		.from(ratings)
		.where(and(eq(ratings.userId, userId), isNull(ratings.deletedAt)));

	if (!row || row.length === 0) return 0;

	return Number(row[0].count);
}
