import {
	useInfiniteQuery,
	useQuery,
	queryOptions,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
	getUserRatingsFn,
	getFeedRatingsFn,
	getPublicFeedRatingsFn,
} from "./api";
import { getRatingBySlugFn } from "./api";
import type { RatingWithRelations } from "./types";
import { getRecentTagsFn, getRecentStuffFn } from "./api";

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

export const ratingQueryOptions = (slug: string | undefined) =>
	queryOptions({
		queryKey: ["rating", slug],
		queryFn: async () => {
			if (!slug) return null;
			return (await getRatingBySlugFn({ data: { slug } })) as {
				success: boolean;
				data: RatingWithRelations | null;
				error?: string;
			};
		},
		staleTime: 0,
		gcTime: 1000 * 60 * 10,
	});

export function useRating(slug?: string) {
	return useQuery(ratingQueryOptions(slug));
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

export function useRecentTags() {
	const fn = useServerFn(getRecentTagsFn);

	return useQuery({
		queryKey: ["recent", "tags"],
		queryFn: async () => {
			const res = (await fn()) as {
				success: boolean;
				data?: { name: string; count: number }[];
				error?: string;
			};
			if (!res.success) throw new Error(res.error ?? "Failed to load tags");
			return res.data ?? [];
		},
		staleTime: 1000 * 60 * 5,
	});
}

export function useRecentStuff() {
	const fn = useServerFn(getRecentStuffFn);

	return useQuery({
		queryKey: ["recent", "stuff"],
		queryFn: async () => {
			const res = (await fn()) as {
				success: boolean;
				data?: { id: string; name: string; count: number }[];
				error?: string;
			};
			if (!res.success) throw new Error(res.error ?? "Failed to load stuff");
			return res.data ?? [];
		},
		staleTime: 1000 * 60 * 5,
	});
}
