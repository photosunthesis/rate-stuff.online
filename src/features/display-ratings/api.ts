import { createServerFn } from "@tanstack/react-start";
import {
	getUserRatings,
	getFeedRatings,
	getRatingBySlug,
	getUserRatingsCount,
	getRatingById,
} from "./service";
import { getRecentTags, getRecentStuff } from "./service";
import { z } from "zod";
import { authMiddleware } from "~/features/auth/middleware";
import {
	createRateLimitMiddleware,
	RATE_LIMITER_BINDING,
} from "~/features/rate-limit/middleware";
import { getUserByUsername } from "~/features/auth/service";
import { rateLimitKeys } from "../rate-limit/middleware";

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

export const getUserRatingsFn = createServerFn({ method: "GET" })
	.middleware([
		authMiddleware,
		createRateLimitMiddleware({
			binding: RATE_LIMITER_BINDING.PAGINATION,
			keyFn: rateLimitKeys.bySessionThenIpAndEndpoint,
			errorMessage: "Too many requests. Please try again later.",
		}),
	])
	.inputValidator(
		z.object({
			limit: z.number().default(10),
			cursor: z.string().optional(),
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const cursor = parseCursor(data.cursor);
			const ratings = await getUserRatings(context.user.id, data.limit, cursor);

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
	.middleware([
		createRateLimitMiddleware({
			binding: RATE_LIMITER_BINDING.PAGINATION,
			keyFn: rateLimitKeys.bySessionThenIpAndEndpoint,
			errorMessage: "Too many requests. Please try again later.",
		}),
	])
	.inputValidator(z.object({ tag: z.string().optional() }))
	.handler(async ({ data }) => {
		try {
			const ratings = await getFeedRatings(12, undefined, data.tag);

			return { success: true, data: ratings, nextCursor: undefined };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to fetch feed",
			};
		}
	});

export const getFeedRatingsFn = createServerFn({ method: "GET" })
	.middleware([
		authMiddleware,
		createRateLimitMiddleware({
			binding: RATE_LIMITER_BINDING.PAGINATION,
			keyFn: rateLimitKeys.bySessionThenIpAndEndpoint,
			errorMessage: "Too many requests. Please try again later.",
		}),
	])
	.inputValidator(
		z.object({
			limit: z.number().default(10),
			cursor: z.string().optional(),
			tag: z.string().optional(),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const cursor = parseCursor(data.cursor);
			const ratings = await getFeedRatings(data.limit, cursor, data.tag);
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

export const getRatingBySlugFn = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			slug: z.string(),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const rating = await getRatingBySlug(data.slug);

			if (!rating) {
				return { success: false, error: "Not found" };
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

export const getRatingsByUsernameFn = createServerFn({ method: "GET" })
	.middleware([
		createRateLimitMiddleware({
			binding: RATE_LIMITER_BINDING.PAGINATION,
			keyFn: rateLimitKeys.bySessionThenIpAndEndpoint,
			errorMessage: "Too many requests. Please try again later.",
		}),
	])
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
			const ratings = await getUserRatings(user.id, limit, cursor);

			let nextCursor: string | undefined;
			if (ratings.length === limit) {
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

export const getUserRatingsCountFn = createServerFn({ method: "GET" })
	.inputValidator(z.object({ username: z.string() }))
	.handler(async ({ data }) => {
		try {
			const user = await getUserByUsername(data.username);

			if (!user) return { success: false, error: "Not found" };

			const count = await getUserRatingsCount(user.id);
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
	.inputValidator(
		z.object({
			id: z.string(),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const rating = await getRatingById(data.id);

			if (!rating) throw new Error("Not found");

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
	.middleware([
		authMiddleware,
		createRateLimitMiddleware({
			binding: RATE_LIMITER_BINDING.GENERAL,
			keyFn: rateLimitKeys.bySessionThenIpAndEndpoint,
			errorMessage: "Too many requests. Please try again later.",
		}),
	])
	.handler(async () => {
		try {
			const tags = await getRecentTags(10);

			return { success: true, data: tags as { name: string; count: number }[] };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to fetch tags",
			};
		}
	});

export const getRecentStuffFn = createServerFn({ method: "GET" })
	.middleware([
		authMiddleware,
		createRateLimitMiddleware({
			binding: RATE_LIMITER_BINDING.GENERAL,
			keyFn: rateLimitKeys.bySessionThenIpAndEndpoint,
			errorMessage: "Too many requests. Please try again later.",
		}),
	])
	.handler(async () => {
		try {
			const stuff = await getRecentStuff(5);
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
