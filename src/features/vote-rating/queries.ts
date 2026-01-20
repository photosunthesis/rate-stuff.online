import { useMutation, useQueryClient } from "@tanstack/react-query";
import { voteRatingFn } from "./functions";
import type { VoteRatingInput } from "./types";
import type { RatingWithRelations } from "../display-ratings/types";

export function useVoteRating() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: VoteRatingInput) => {
			const result = await voteRatingFn({ data });
			if (!result.success) throw new Error(result.error);
			return result;
		},
		onMutate: async (newVote) => {
			await queryClient.cancelQueries({
				queryKey: ["rating", newVote.ratingId],
			});

			const previousRating = queryClient.getQueryData<{
				success: boolean;
				data: RatingWithRelations;
			}>(["rating", newVote.ratingId]);

			queryClient.setQueryData(
				["rating", newVote.ratingId],
				(old: { success: boolean; data: RatingWithRelations } | undefined) => {
					if (!old || !old.data) return old;

					const currentVote = old.data.userVote;
					let upvotesCount = old.data.upvotesCount;
					let downvotesCount = old.data.downvotesCount;

					// Remove previous vote influence
					if (currentVote === "up") upvotesCount--;
					else if (currentVote === "down") downvotesCount--;

					// Add new vote influence
					const newVoteType = newVote.vote;
					if (newVoteType === "up") upvotesCount++;
					else if (newVoteType === "down") downvotesCount++;

					return {
						...old,
						data: {
							...old.data,
							upvotesCount,
							downvotesCount,
							userVote: newVoteType === "none" ? null : newVoteType,
						},
					};
				},
			);

			return { previousRating };
		},
		onError: (_err, newVote, context) => {
			queryClient.setQueryData(
				["rating", newVote.ratingId],
				context?.previousRating,
			);
		},
		onSettled: (_data, _error, variables) => {
			queryClient.invalidateQueries({ queryKey: ["ratings"] });
			queryClient.invalidateQueries({ queryKey: ["feed"] });
			queryClient.invalidateQueries({ queryKey: ["stuff"] });
			queryClient.invalidateQueries({
				queryKey: ["rating", variables.ratingId],
			});
		},
	});
}
