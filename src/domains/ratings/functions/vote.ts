import { createServerFn } from "@tanstack/react-start";
import { voteRatingSchema } from "../types/vote";
import { voteRating } from "../services/vote";
import { authMiddleware } from "~/domains/users/middleware";
import { actionRateLimitMiddleware } from "~/infrastructure/rate-limit/middleware";

export const voteRatingFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware, actionRateLimitMiddleware])
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
