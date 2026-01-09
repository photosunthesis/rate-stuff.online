import { createServerFn } from "@tanstack/react-start";
import { getUserRatings, getFeedRatings } from "./service";
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
			const cursor = data.cursor
				? new Date(data.cursor).toISOString()
				: undefined;

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
			const cursor = data.cursor
				? new Date(data.cursor).toISOString()
				: undefined;

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
