import { z } from "zod";

export const voteRatingSchema = z.object({
	ratingId: z.string().min(1),
	vote: z.union([z.literal("up"), z.literal("down"), z.literal("none")]),
});

export type VoteRatingInput = z.infer<typeof voteRatingSchema>;
