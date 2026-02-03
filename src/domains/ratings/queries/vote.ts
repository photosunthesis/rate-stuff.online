import {
	useMutation,
	useQueryClient,
	type InfiniteData,
} from "@tanstack/react-query";
import { voteRatingFn } from "../functions/vote";
import type { VoteRatingInput } from "../types/vote";
import type { RatingWithRelations } from "../types/display";

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
			await queryClient.cancelQueries({
				queryKey: ["ratings"],
			});

			const previousRating = queryClient.getQueryData<{
				success: boolean;
				data: RatingWithRelations;
			}>(["rating", newVote.ratingId]);

			const calculateNewStats = (rating: RatingWithRelations) => {
				const currentVote = rating.userVote;
				let upvotesCount = rating.upvotesCount;
				let downvotesCount = rating.downvotesCount;

				// Remove previous vote influence
				if (currentVote === "up") upvotesCount--;
				else if (currentVote === "down") downvotesCount--;

				// Add new vote influence
				const newVoteType = newVote.vote;
				if (newVoteType === "up") upvotesCount++;
				else if (newVoteType === "down") downvotesCount++;

				return {
					...rating,
					upvotesCount,
					downvotesCount,
					userVote: newVoteType === "none" ? null : newVoteType,
				};
			};

			queryClient.setQueryData(
				["rating", newVote.ratingId],
				(old: { success: boolean; data: RatingWithRelations } | undefined) => {
					if (!old || !old.data) return old;
					return {
						...old,
						data: calculateNewStats(old.data),
					};
				},
			);

			queryClient.setQueriesData<
				InfiniteData<{ data?: RatingWithRelations[] }>
			>({ queryKey: ["ratings"] }, (old) => {
				if (!old) return old;
				return {
					...old,
					pages: old.pages.map((page) => ({
						...page,
						data: page.data?.map((r) => {
							if (r.id !== newVote.ratingId) return r;
							return calculateNewStats(r);
						}),
					})),
				};
			});

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
			queryClient.invalidateQueries({ queryKey: ["stuff"] });
			queryClient.invalidateQueries({
				queryKey: ["rating", variables.ratingId],
			});
		},
	});
}
