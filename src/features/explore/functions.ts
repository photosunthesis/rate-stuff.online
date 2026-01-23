import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "~/features/auth/middleware";
import { paginationRateLimitMiddleware } from "~/features/rate-limit/middleware";
import { getVisualRatings } from "./service";
import { z } from "zod";

export const getVisualRatingsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware, paginationRateLimitMiddleware])
	.inputValidator(
		z.object({
			cursor: z
				.object({
					createdAt: z.date(),
					id: z.string(),
				})
				.optional(),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const result = await getVisualRatings(20, data.cursor);
			return {
				success: true,
				data: result,
			};
		} catch (error) {
			console.error("Visual ratings fetch error:", error);
			return {
				success: false,
				errorMessage: "Failed to load visual ratings",
			};
		}
	});
