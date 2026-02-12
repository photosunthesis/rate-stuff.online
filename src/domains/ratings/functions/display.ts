import { createServerFn } from "@tanstack/react-start";
import {
	getUserRatings,
	getFeedRatings,
	getUserRatingsCount,
	getRatingById,
} from "../services/display";
import { getRecentTags, getRecentStuff } from "../services/display";
import { z } from "zod";
import { authMiddleware } from "~/domains/users/middleware";
import {
	paginationRateLimitMiddleware,
	generalRateLimitMiddleware,
} from "~/infrastructure/rate-limit/middleware";
import { getUserByUsername } from "~/domains/users/service";
import { getAuth } from "~/domains/users/auth/server";
import { getRequest } from "@tanstack/react-start/server";
import { setPublicCacheHeader } from "~/utils/cache";

function parseCursor(cursor?: string) {
	if (!cursor) return undefined;
	const [datePart, id] = cursor.split("|");
	if (!datePart || !id) return undefined;
	const createdAt = new Date(datePart);
	if (Number.isNaN(createdAt.getTime())) return undefined;
	return { createdAt, id };
}

function makeCursor(createdAt: Date | string | number, id: string) {
	return `${new Date(createdAt).toISOString()}|${id}`;
}

async function getUserId() {
	try {
		const session = await getAuth().api.getSession({
			headers: getRequest().headers,
		});
		return session?.user?.id;
	} catch {
		return undefined;
	}
}

export const getUserRatingsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware, paginationRateLimitMiddleware])
	.inputValidator(
		z.object({
			limit: z.number().default(10),
			cursor: z.string().optional(),
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const cursor = parseCursor(data.cursor);
			// For getUserRatingsFn which is "my ratings", target user is same as viewer
			const ratings = await getUserRatings(
				context.user.id,
				data.limit,
				cursor,
				context.user.id,
			);

			let nextCursor: string | undefined;

			if (ratings.length === data.limit) {
				const last = ratings[ratings.length - 1];
				nextCursor = makeCursor(last.createdAt, last.id);
			}

			return { success: true, data: ratings, nextCursor };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to fetch ratings",
			};
		}
	});

export const getPublicFeedRatingsFn = createServerFn({ method: "GET" })
	.middleware([paginationRateLimitMiddleware])
	.inputValidator(
		z.object({
			limit: z.number().default(10),
			cursor: z.string().optional(),
			tag: z.string().optional(),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const userId = await getUserId();
			const cursor = parseCursor(data.cursor);
			const ratings = await getFeedRatings(
				data.limit,
				cursor,
				data.tag,
				userId,
			);

			let nextCursor: string | undefined;

			if (ratings.length === data.limit) {
				const last = ratings[ratings.length - 1];
				nextCursor = makeCursor(last.createdAt, last.id);
			}

			if (!userId) {
				setPublicCacheHeader();
			}

			return { success: true, data: ratings, nextCursor };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to fetch feed",
			};
		}
	});

export const getFeedRatingsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware, paginationRateLimitMiddleware])
	.inputValidator(
		z.object({
			limit: z.number().default(10),
			cursor: z.string().optional(),
			tag: z.string().optional(),
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const cursor = parseCursor(data.cursor);
			const ratings = await getFeedRatings(
				data.limit,
				cursor,
				data.tag,
				context.user.id,
			);
			let nextCursor: string | undefined;

			if (ratings.length === data.limit) {
				const last = ratings[ratings.length - 1];
				nextCursor = makeCursor(last.createdAt, last.id);
			}

			return { success: true, data: ratings, nextCursor };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to fetch feed",
			};
		}
	});

export const getRatingsByUsernameFn = createServerFn({ method: "GET" })
	.middleware([paginationRateLimitMiddleware])
	.inputValidator(
		z.object({
			username: z.string(),
			limit: z.number().optional(),
			cursor: z.string().optional(),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const user = await getUserByUsername(data.username);

			if (!user) return { success: false, error: "Not found" };

			// Limit is determined by the caller (client). Remove server-side
			// session check to avoid requiring request headers here — the
			// client passes a capped `limit` based on auth state.
			const limit = data.limit ?? 10;
			const cursor = parseCursor(data.cursor);

			const viewerId = await getUserId();

			const ratings = await getUserRatings(user.id, limit, cursor, viewerId);

			let nextCursor: string | undefined;
			if (ratings.length === limit) {
				const last = ratings[ratings.length - 1];
				nextCursor = makeCursor(last.createdAt, last.id);
			}

			if (!viewerId) {
				setPublicCacheHeader();
			}

			return { success: true, data: ratings, nextCursor };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to fetch ratings",
			};
		}
	});

export const getUserRatingsCountFn = createServerFn({ method: "GET" })
	.middleware([generalRateLimitMiddleware])
	.inputValidator(z.object({ username: z.string() }))
	.handler(async ({ data }) => {
		try {
			const user = await getUserByUsername(data.username);

			if (!user) return { success: false, error: "Not found" };

			const count = await getUserRatingsCount(user.id);

			setPublicCacheHeader();

			return { success: true, data: { count } };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to fetch ratings count",
			};
		}
	});

export const getRatingByIdFn = createServerFn({ method: "GET" })
	.middleware([generalRateLimitMiddleware])
	.inputValidator(
		z.object({
			id: z.string(),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const userId = await getUserId();
			const rating = await getRatingById(data.id, userId);

			if (!rating) throw new Error("Not found");

			if (!userId) {
				setPublicCacheHeader();
			}

			return { success: true, data: rating };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to fetch rating",
			};
		}
	});

export const getRecentTagsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware, generalRateLimitMiddleware])
	.handler(async () => {
		try {
			const tags = await getRecentTags(10);

			setPublicCacheHeader();

			return { success: true, data: tags as { name: string; count: number }[] };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to fetch tags",
			};
		}
	});

export const getRecentStuffFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware, generalRateLimitMiddleware])
	.handler(async () => {
		try {
			const stuff = await getRecentStuff(5);

			setPublicCacheHeader();

			return {
				success: true,
				data: stuff as {
					id: string;
					name: string;
					slug: string;
					count: number;
				}[],
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to fetch stuff",
			};
		}
	});
