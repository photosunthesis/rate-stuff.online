import { createServerFn } from "@tanstack/react-start";
import { getSession } from "~/utils/auth-utils";
import { getUserRatings, getFeedRatings } from "./service";
import { z } from "zod";

export const getUserRatingsFn = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			limit: z.number().default(10),
			cursor: z.string().optional(),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const session = await getSession();
			if (!session || !session.userId) {
				return { success: false, error: "Unauthorized" };
			}

			const cursor = data.cursor
				? new Date(data.cursor).toISOString()
				: undefined;
			const ratings = await getUserRatings(session.userId, data.limit, cursor);

			let nextCursor: string | undefined;
			if (ratings.length === data.limit) {
				const lastCreatedAt = ratings[ratings.length - 1].createdAt;
				nextCursor = new Date(lastCreatedAt).toISOString();
			}

			const serializedRatings = ratings.map((rating) => ({
				...rating,
				createdAt: rating.createdAt,
				updatedAt: rating.updatedAt,
				user: {
					...rating.user,
					avatarUrl: rating.user?.avatarUrl ?? null,
				},
				stuff: {
					...rating.stuff,
					createdAt: rating.stuff.createdAt,
					updatedAt: rating.stuff.updatedAt,
				},
			}));

			return { success: true, data: serializedRatings, nextCursor };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to fetch ratings",
			};
		}
	});

export const getFeedRatingsFn = createServerFn({ method: "GET" })
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

			const serializedRatings = ratings.map((rating) => ({
				...rating,
				createdAt: rating.createdAt,
				updatedAt: rating.updatedAt,
				user: {
					...rating.user,
					avatarUrl: rating.user?.avatarUrl ?? null,
				},
				stuff: {
					...rating.stuff,
					createdAt: rating.stuff.createdAt,
					updatedAt: rating.stuff.updatedAt,
				},
			}));

			return { success: true, data: serializedRatings, nextCursor };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to fetch feed",
			};
		}
	});
