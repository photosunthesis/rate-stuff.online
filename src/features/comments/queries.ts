import {
	infiniteQueryOptions,
	useMutation,
	useQueryClient,
	type InfiniteData,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createCommentFn, getCommentsFn, voteCommentFn } from "./functions";
import type {
	CommentWithRelations,
	CreateCommentInput,
	VoteCommentInput,
} from "./types";

export const commentKeys = {
	all: ["comments"] as const,
	lists: () => [...commentKeys.all, "list"] as const,
	list: (ratingId: string) => [...commentKeys.lists(), ratingId] as const,
};

export const commentsQueryOptions = (ratingId: string) =>
	infiniteQueryOptions({
		queryKey: commentKeys.list(ratingId),
		queryFn: async ({ pageParam }: { pageParam?: string }) => {
			const res = await getCommentsFn({
				data: { ratingId, cursor: pageParam },
			});
			if (!res.success) throw new Error(res.errorMessage);
			return res.data;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => lastPage?.nextCursor,
	});

export const useCreateComment = () => {
	const queryClient = useQueryClient();
	const createComment = useServerFn(createCommentFn);

	return useMutation({
		mutationFn: async (input: CreateCommentInput) => {
			const res = await createComment({ data: input });
			// Ensure we always throw if success is false, so onError/onSuccess work correctly
			if (!res.success) throw new Error(res.errorMessage);
			return res.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: commentKeys.list(variables.ratingId),
			});
			// Invalidate rating to update comment count
			queryClient.invalidateQueries({
				queryKey: ["ratings", variables.ratingId],
			});
			// Also invalidate list of ratings where this rating might appear,
			// though that's harder to target precisely.
			// For now, updating the specific rating view is most important.
		},
	});
};

export const useVoteComment = () => {
	const queryClient = useQueryClient();
	const voteComment = useServerFn(voteCommentFn);

	return useMutation({
		mutationFn: async (input: VoteCommentInput) => {
			const res = await voteComment({ data: input });
			if (!res.success) throw new Error(res.errorMessage);
			return res.data;
		},
		onMutate: async (newVote) => {
			await queryClient.cancelQueries({ queryKey: commentKeys.lists() });

			const previousComments = queryClient.getQueriesData<
				InfiniteData<{
					comments: CommentWithRelations[];
					nextCursor?: string | undefined;
				}>
			>({
				queryKey: commentKeys.lists(),
			});

			queryClient.setQueriesData<
				InfiniteData<{
					comments: CommentWithRelations[];
					nextCursor?: string | undefined;
				}>
			>({ queryKey: commentKeys.lists() }, (old) => {
				if (!old || !old.pages) return old;

				return {
					...old,
					pages: old.pages.map((page) => ({
						...page,
						comments: page.comments.map((comment) => {
							if (comment.id !== newVote.commentId) return comment;

							const currentVote = comment.userVote as "up" | "down" | null;
							let upvotesCount = comment.upvotesCount;
							let downvotesCount = comment.downvotesCount;
							const voteType = newVote.type;

							let nextVote: "up" | "down" | null = null;

							if (currentVote === voteType) {
								// Remove vote
								nextVote = null;
								if (voteType === "up") upvotesCount--;
								else downvotesCount--;
							} else {
								// Switch or Add
								nextVote = voteType;
								// Remove old influence
								if (currentVote === "up") upvotesCount--;
								else if (currentVote === "down") downvotesCount--;

								// Add new influence
								if (voteType === "up") upvotesCount++;
								else downvotesCount++;
							}

							return {
								...comment,
								upvotesCount,
								downvotesCount,
								userVote: nextVote,
							};
						}),
					})),
				};
			});

			return { previousComments };
		},
		onError: (_err, _newVote, context) => {
			if (context?.previousComments) {
				context.previousComments.forEach(([queryKey, data]) => {
					queryClient.setQueryData(queryKey, data);
				});
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: commentKeys.lists() });
		},
	});
};
