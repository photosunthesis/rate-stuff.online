import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "~/features/auth/middleware";
import { getVisualRatings } from "./service";

import { z } from "zod";

export const getVisualRatingsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.inputValidator(
		z.object({
			cursor: z
				.object({
					createdAt: z.string().transform((str) => new Date(str)), // Dates over JSON are strings
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
