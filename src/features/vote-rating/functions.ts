import { createServerFn } from "@tanstack/react-start";
import { voteRatingSchema } from "./types";
import { voteRating } from "./service";
import { authMiddleware } from "~/features/auth/middleware";
import {
	createRateLimitMiddleware,
	rateLimitKeys,
} from "~/features/rate-limit/middleware";

export const voteRatingFn = createServerFn({ method: "POST" })
	.middleware([
		authMiddleware,
		createRateLimitMiddleware({
			binding: "GENERAL",
			keyFn: rateLimitKeys.bySession,
			errorMessage: "Too many requests. Please try again after a short while.",
		}),
	])
	.inputValidator(voteRatingSchema)
	.handler(async ({ data, context }) => {
		try {
			await voteRating(context.user.id, data);
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to vote",
			};
		}
	});
