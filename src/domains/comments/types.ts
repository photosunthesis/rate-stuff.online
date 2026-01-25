import { z } from "zod";
import type { comments, users } from "~/db/schema";

export type CommentWithRelations = typeof comments.$inferSelect & {
	user: typeof users.$inferSelect | null;
	userVote: "up" | "down" | null;
};

export const createCommentSchema = z.object({
	ratingId: z.uuid(),
	content: z
		.string()
		.min(1, "Comment cannot be empty")
		.max(2000, "Comment is too long"),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const voteCommentSchema = z.object({
	commentId: z.uuid(),
	type: z.enum(["up", "down"]),
});

export type VoteCommentInput = z.infer<typeof voteCommentSchema>;

export const getCommentsSchema = z.object({
	ratingId: z.uuid(),
	cursor: z.string().optional(),
	limit: z.number().min(1).max(50).default(10),
});

export type GetCommentsInput = z.infer<typeof getCommentsSchema>;

export const updateCommentSchema = z.object({
	commentId: z.uuid(),
	content: z
		.string()
		.min(1, "Comment cannot be empty")
		.max(2000, "Comment is too long"),
});

export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

export const deleteCommentSchema = z.object({
	commentId: z.uuid(),
});

export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;
