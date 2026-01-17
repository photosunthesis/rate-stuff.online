import { useMutation, useQueryClient } from "@tanstack/react-query";
import { voteRatingFn } from "./functions";
import type { VoteRatingInput } from "./types";

export function useVoteRating() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: VoteRatingInput) => {
			const result = await voteRatingFn({ data });
			if (!result.success) throw new Error(result.error);
			return result;
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
