import { useInfiniteQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getUserRatingsFn, getFeedRatingsFn } from "./api";

export const ratingKeys = {
	all: ["ratings"] as const,
	feed: () => [...ratingKeys.all, "feed"] as const,
	mine: () => [...ratingKeys.all, "mine"] as const,
};

export function useUserRatings(limit: number = 10) {
	const getUserRatings = useServerFn(getUserRatingsFn);

	return useInfiniteQuery({
		queryKey: ratingKeys.mine(),
		queryFn: async ({ pageParam }: { pageParam?: string }) => {
			return getUserRatings({
				data: {
					limit,
					cursor: pageParam,
				},
			});
		},
		getNextPageParam: (lastPage) => {
			if (!lastPage.success) return undefined;
			return lastPage.nextCursor;
		},
		initialPageParam: undefined as string | undefined,
	});
}

export function useFeedRatings(limit: number = 10) {
	const getFeedRatings = useServerFn(getFeedRatingsFn);

	return useInfiniteQuery({
		queryKey: ratingKeys.feed(),
		queryFn: async ({ pageParam }: { pageParam?: string }) => {
			return getFeedRatings({
				data: {
					limit,
					cursor: pageParam,
				},
			});
		},
		getNextPageParam: (lastPage) => {
			if (!lastPage.success) return undefined;
			return lastPage.nextCursor;
		},
		initialPageParam: undefined as string | undefined,
	});
}
