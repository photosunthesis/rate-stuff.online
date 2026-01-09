import { createServerFn } from "@tanstack/react-start";
import { getUserRatings, getFeedRatings, getRatingById } from "./service";
import { getRecentTags, getRecentStuff } from "./service";
import { authMiddleware } from "~/middlewares/auth-middleware";
import { z } from "zod";

export const getUserRatingsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.inputValidator(
		z.object({
			limit: z.number().default(10),
			cursor: z.string().optional(),
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const cursor = data.cursor ? new Date(data.cursor) : undefined;

			const ratings = await getUserRatings(
				context.userSession.userId,
				data.limit,
				cursor,
			);

			let nextCursor: string | undefined;

			if (ratings.length === data.limit) {
				const lastCreatedAt = ratings[ratings.length - 1].createdAt;
				nextCursor = new Date(lastCreatedAt).toISOString();
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

export const getPublicFeedRatingsFn = createServerFn({ method: "GET" }).handler(
	async () => {
		try {
			const ratings = await getFeedRatings(12);

			// Always return the wrapped shape
			return { success: true, data: ratings, nextCursor: undefined };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to fetch feed",
			};
		}
	},
);

export const getFeedRatingsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.inputValidator(
		z.object({
			limit: z.number().default(10),
			cursor: z.string().optional(),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const cursor = data.cursor ? new Date(data.cursor) : undefined;

			const ratings = await getFeedRatings(data.limit, cursor);

			let nextCursor: string | undefined;
			if (ratings.length === data.limit) {
				const lastCreatedAt = ratings[ratings.length - 1].createdAt;
				nextCursor = new Date(lastCreatedAt).toISOString();
			}

			return { success: true, data: ratings, nextCursor };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to fetch feed",
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

export const getRecentTagsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async () => {
		try {
			const tags = await getRecentTags(10);
			return { success: true, data: tags };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to fetch tags",
			};
		}
	});

export const getRecentStuffFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async () => {
		try {
			const stuff = await getRecentStuff(5);
			return { success: true, data: stuff };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to fetch recent stuff",
			};
		}
	});
