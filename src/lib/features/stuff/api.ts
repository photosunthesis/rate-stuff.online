import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getStuffBySlug, getStuffRatingsBySlug } from "./service";

export const getStuffBySlugFn = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			slug: z.string(),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const s = await getStuffBySlug(data.slug);
			if (!s) return { success: false, error: "Not found" };
			return { success: true, data: s };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to fetch stuff",
			};
		}
	});

export const getPaginatedStuffRatingsFn = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			slug: z.string(),
			limit: z.number().default(10),
			cursor: z.string().optional(),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const page = await getStuffRatingsBySlug(
				data.slug,
				data.limit,
				data.cursor,
			);
			if (!page) return { success: false, error: "Not found" };

			return { success: true, data: page.ratings, nextCursor: page.nextCursor };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to fetch stuff ratings",
			};
		}
	});
