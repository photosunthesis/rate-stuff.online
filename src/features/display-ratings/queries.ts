import { useInfiniteQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
	getUserRatingsFn,
	getFeedRatingsFn,
	getPublicFeedRatingsFn,
} from "./api";
import type { RatingWithRelations } from "./types";

// Normalized page result used by the hooks (wrapped shape only)
type PageResult = {
	success: boolean;
	data: RatingWithRelations[];
	nextCursor?: string;
	error?: string;
};

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
			return (await getUserRatings({
				data: {
					limit,
					cursor: pageParam,
				},
			})) as PageResult;
		},
		getNextPageParam: (lastPage: PageResult) => {
			if (!lastPage) return undefined;
			if (lastPage.success === false) return undefined;
			return lastPage.nextCursor;
		},

		initialPageParam: undefined as string | undefined,
	});
}

export function useFeedRatings(
	limit: number = 10,
	isAuthenticated: boolean = true,
) {
	const serverFn = isAuthenticated ? getFeedRatingsFn : getPublicFeedRatingsFn;
	const getFeedRatings = useServerFn(serverFn);

	return useInfiniteQuery({
		queryKey: ratingKeys.feed(),
		queryFn: async ({ pageParam }: { pageParam?: string }) => {
			return (await getFeedRatings({
				data: {
					limit,
					cursor: pageParam,
				},
			})) as PageResult;
		},
		getNextPageParam: (lastPage: PageResult) => {
			if (!lastPage) return undefined;
			if (lastPage.success === false) return undefined;
			return lastPage.nextCursor;
		},

		initialPageParam: undefined as string | undefined,
	});
}
