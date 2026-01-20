import { z } from "zod";
import type { comments, users } from "~/db/schema";

export type CommentWithRelations = typeof comments.$inferSelect & {
	user: typeof users.$inferSelect | null;
	userVote: "up" | "down" | null;
};

export const createCommentSchema = z.object({
	ratingId: z.string().uuid(),
	content: z
		.string()
		.min(1, "Comment cannot be empty")
		.max(2000, "Comment is too long"),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const voteCommentSchema = z.object({
	commentId: z.string().uuid(),
	type: z.enum(["up", "down"]),
});

export type VoteCommentInput = z.infer<typeof voteCommentSchema>;

export const getCommentsSchema = z.object({
	ratingId: z.string().uuid(),
	cursor: z.string().optional(),
	limit: z.number().min(1).max(50).default(10),
});

export type GetCommentsInput = z.infer<typeof getCommentsSchema>;
