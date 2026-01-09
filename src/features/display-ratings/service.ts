import { db } from "~/db/index";
import { ratings } from "~/db/schema";
import { and, isNull, desc, lt, eq, gte } from "drizzle-orm";

export async function getUserRatings(
	userId: string,
	limit = 10,
	cursor?: Date,
) {
	const results = await db.query.ratings.findMany({
		where: and(
			eq(ratings.userId, userId),
			isNull(ratings.deletedAt),
			cursor ? lt(ratings.createdAt, cursor) : undefined,
		),
		limit,
		orderBy: desc(ratings.createdAt),
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

	// Normalize tags to simple string[] for client usage ✅
	return results.map((r) => ({
		...r,
		tags: (r.tags ?? []).map((t) => t.tag.name),
	}));
}

export async function getFeedRatings(limit = 10, cursor?: Date) {
	const results = await db.query.ratings.findMany({
		where: and(
			isNull(ratings.deletedAt),
			cursor ? lt(ratings.createdAt, cursor) : undefined,
		),
		limit,
		orderBy: desc(ratings.createdAt),
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

	// Normalize tags to simple string[] for client usage ✅
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

export async function getRecentTags(limit = 10) {
	const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

	const results = await db.query.ratings.findMany({
		where: and(isNull(ratings.deletedAt), gte(ratings.createdAt, weekAgo)),
		with: {
			tags: {
				with: {
					tag: true,
				},
			},
		},
	});

	// Count occurrences of each tag in the last week
	const counts: Record<string, number> = {};

	for (const r of results) {
		for (const t of r.tags ?? []) {
			const name = t.tag.name;
			counts[name] = (counts[name] ?? 0) + 1;
		}
	}

	const items = Object.entries(counts)
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, limit);

	return items;
}

export async function getRecentStuff(limit = 5) {
	const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

	const results = await db.query.ratings.findMany({
		where: and(isNull(ratings.deletedAt), gte(ratings.createdAt, weekAgo)),
		with: {
			stuff: true,
		},
	});

	// Count ratings per stuff in the last week
	const counts: Record<string, { id: string; name: string; count: number }> =
		{};

	for (const r of results) {
		if (!r.stuff) continue;
		const id = r.stuff.id;
		if (!counts[id]) {
			counts[id] = { id, name: r.stuff.name, count: 0 };
		}
		counts[id].count += 1;
	}

	const items = Object.values(counts)
		.sort((a, b) => b.count - a.count)
		.slice(0, limit)
		.map((s) => ({ id: s.id, name: s.name, count: s.count }));

	return items;
}
