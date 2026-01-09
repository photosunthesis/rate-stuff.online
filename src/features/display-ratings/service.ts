import { db } from "~/db/index";
import { ratings } from "~/db/schema";
import { and, isNull, desc, lt, eq } from "drizzle-orm";

export async function getUserRatings(
	userId: string,
	limit = 10,
	cursor?: Date,
) {
	return db.query.ratings.findMany({
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

	return results;
}
