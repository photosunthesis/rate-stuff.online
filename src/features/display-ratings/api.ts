import { createServerFn } from "@tanstack/react-start";
import { getUserRatings, getFeedRatings, getRatingById } from "./service";
import { getRecentTags, getRecentStuff } from "./service";
import { authMiddleware } from "~/middlewares/auth-middleware";
import { z } from "zod";

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
	.middleware([authMiddleware])
	.inputValidator(
		z.object({
			limit: z.number().default(10),
			cursor: z.string().optional(),
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const cursor = parseCursor(data.cursor);

			const ratings = await getUserRatings(
				context.userSession.userId,
				data.limit,
				cursor,
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
			const cursor = parseCursor(data.cursor);

			const ratings = await getFeedRatings(data.limit, cursor);

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
