import { db } from "~/db/index";
import { ratings, ratingsToTags, tags, stuff } from "~/db/schema";
import { and, isNull, desc, lt, eq, gte, sql, or } from "drizzle-orm";

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

	const results = await db.query.ratings.findMany({
		where: and(
			eq(ratings.userId, userId),
			isNull(ratings.deletedAt),
			cursorFilter,
		),
		limit,
		orderBy: [desc(ratings.createdAt), desc(ratings.id)],
		with: {
			stuff: true,
			user: {
				columns: {
					id: true,
					name: true,
					username: true,
					avatarUrl: true,
				},
			},
			tags: {
				with: {
					tag: true,
				},
			},
		},
	});

	return results.map((r) => ({
		...r,
		tags: (r.tags ?? []).map((t) => t.tag.name),
	}));
}

export async function getFeedRatings(
	limit = 10,
	cursor?: { createdAt: Date; id: string },
) {
	const cursorFilter = cursor
		? or(
				lt(ratings.createdAt, cursor.createdAt),
				and(eq(ratings.createdAt, cursor.createdAt), lt(ratings.id, cursor.id)),
			)
		: undefined;

	const results = await db.query.ratings.findMany({
		where: and(isNull(ratings.deletedAt), cursorFilter),
		limit,
		orderBy: [desc(ratings.createdAt), desc(ratings.id)],
		with: {
			stuff: true,
			user: {
				columns: {
					id: true,
					name: true,
					username: true,
					avatarUrl: true,
				},
			},
			tags: {
				with: {
					tag: true,
				},
			},
		},
	});

	return results.map((r) => ({
		...r,
		tags: (r.tags ?? []).map((t) => t.tag.name),
	}));
}

export async function getRatingById(id: string) {
	const result = await db.query.ratings.findFirst({
		where: eq(ratings.id, id),
		with: {
			stuff: true,
			user: {
				columns: {
					id: true,
					name: true,
					username: true,
					avatarUrl: true,
				},
			},
			tags: {
				with: {
					tag: true,
				},
			},
		},
	});

	if (!result) return null;

	return {
		...result,
		tags: (result.tags ?? []).map((t) => t.tag.name),
	};
}

export async function getRatingBySlug(slug: string) {
	const result = await db.query.ratings.findFirst({
		where: eq(ratings.slug, slug),
		with: {
			stuff: true,
			user: {
				columns: {
					id: true,
					name: true,
					username: true,
					avatarUrl: true,
				},
			},
			tags: {
				with: {
					tag: true,
				},
			},
		},
	});

	if (!result) return null;

	return {
		...result,
		tags: (result.tags ?? []).map((t) => t.tag.name),
	};
}

export async function getRecentTags(limit = 10) {
	const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

	const rows = await db
		.select({ name: tags.name, count: sql`COUNT(*)` })
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
	const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

	const rows = await db
		.select({ id: stuff.id, name: stuff.name, count: sql`COUNT(*)`, slug: stuff.slug })
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
