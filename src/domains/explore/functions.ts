import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "~/domains/users/middleware";
import { paginationRateLimitMiddleware } from "~/infrastructure/rate-limit/middleware";
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
		} catch (_) {
			return {
				success: false,
				errorMessage: "Failed to load visual ratings",
			};
		}
	});
