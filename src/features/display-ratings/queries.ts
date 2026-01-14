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
	getRatingsByUsernameFn,
	getUserRatingsCountFn,
	getRatingByIdFn,
} from "./api";
import type { RatingWithRelations } from "./types";
import { getRecentTagsFn, getRecentStuffFn } from "./api";

type PageResult = {
	success: boolean;
	data?: RatingWithRelations[];
	nextCursor?: string;
	error?: string;
};

export const ratingKeys = {
	all: ["ratings"] as const,
	feed: (tag?: string) =>
		tag
			? ([...ratingKeys.all, "feed", "tag", tag] as const)
			: ([...ratingKeys.all, "feed", "all"] as const),
	mine: () => [...ratingKeys.all, "mine"] as const,
	user: (username: string) => [...ratingKeys.all, "user", username] as const,
};

export function useUserRatings(limit: number = 10) {
	const getUserRatings = useServerFn(getUserRatingsFn);

	return useInfiniteQuery({
		queryKey: ratingKeys.mine(),
		queryFn: async ({ pageParam }: { pageParam?: string }) => {
			const res = (await getUserRatings({
				data: {
					limit,
					cursor: pageParam,
				},
			})) as PageResult;
			if (!res || res.success === false)
				throw new Error(res?.error ?? "Failed to load ratings");
			return res;
		},
		getNextPageParam: (lastPage: PageResult) => {
			if (!lastPage) return undefined;
			if (lastPage.success === false) return undefined;
			return lastPage.nextCursor;
		},

		initialPageParam: undefined as string | undefined,
	});
}

export const ratingQueryOptions = (id: string | undefined) =>
	queryOptions({
		queryKey: ["rating", id],
		queryFn: async () => {
			if (!id) return null;
			const res = (await getRatingByIdFn({ data: { id } })) as {
				success: boolean;
				data?: RatingWithRelations;
				error?: string;
			};
			if (!res || res.success === false)
				throw new Error(res.error ?? "Failed to load rating");
			return res;
		},
		staleTime: 0,
		gcTime: 1000 * 60 * 10,
	});

export function useFeedRatings(
	limit: number = 10,
	isAuthenticated: boolean,
	tag?: string,
) {
	const serverFn = isAuthenticated ? getFeedRatingsFn : getPublicFeedRatingsFn;
	const getFeedRatings = useServerFn(serverFn);

	return useInfiniteQuery({
		queryKey: ratingKeys.feed(tag),
		queryFn: async ({ pageParam }: { pageParam?: string }) => {
			const res = (await getFeedRatings({
				data: {
					limit,
					cursor: pageParam,
					tag,
				},
			})) as PageResult;
			if (!res || res.success === false)
				throw new Error(res.error ?? "Failed to load feed");
			return res;
		},
		getNextPageParam: (lastPage: PageResult) => {
			if (!lastPage) return undefined;
			if (lastPage.success === false) return undefined;
			// Disable pagination for unauthenticated users (only first page)
			if (!isAuthenticated) return undefined;
			return lastPage.nextCursor;
		},

		initialPageParam: undefined as string | undefined,
	});
}

export function usePublicUserRatings(
	username: string | undefined,
	limit: number = 10,
	isAuthenticated: boolean = true,
) {
	const getRatings = useServerFn(getRatingsByUsernameFn);
	const effectiveLimit = isAuthenticated ? limit : Math.min(limit, 10);
	const key = username
		? [...ratingKeys.user(username), isAuthenticated ? "auth" : "public"]
		: [
				...ratingKeys.all,
				"user",
				undefined,
				isAuthenticated ? "auth" : "public",
			];

	return useInfiniteQuery({
		queryKey: key,
		queryFn: async ({ pageParam }: { pageParam?: string }) => {
			const res = (await getRatings({
				data: {
					username: username ?? "",
					limit: effectiveLimit,
					cursor: pageParam,
				},
			})) as PageResult;
			if (!res || res.success === false)
				throw new Error(res.error ?? "Failed to load ratings");
			return res;
		},
		getNextPageParam: (lastPage: PageResult) => {
			if (!lastPage) return undefined;
			if (lastPage.success === false) return undefined;
			// Disable pagination for unauthenticated users (only first page)
			if (!isAuthenticated) return undefined;
			return lastPage.nextCursor;
		},

		initialPageParam: undefined as string | undefined,
	});
}

export function useUserRatingsCount(
	username: string | undefined,
	enabled = true,
) {
	const getCount = useServerFn(getUserRatingsCountFn);

	return useQuery({
		queryKey: username
			? [...ratingKeys.user(username), "count"]
			: ["ratings", "user", undefined, "count"],
		queryFn: async () => {
			if (!username) return { count: 0 };
			const res = (await getCount({ data: { username } })) as {
				success: boolean;
				data?: { count: number } | null;
				error?: string;
			};
			if (!res || res.success === false)
				throw new Error(res.error ?? "Failed to load count");
			return res.data ?? { count: 0 };
		},
		enabled,
		staleTime: 1000 * 60 * 5,
	});
}

export function useRecentTags(enabled: boolean = true) {
	const fn = useServerFn(getRecentTagsFn);

	return useQuery({
		queryKey: ["recent", "tags"],
		queryFn: async () => {
			const res = (await fn()) as {
				success: boolean;
				data?: { name: string; count: number }[];
				error?: string;
			};
			if (!res || res.success === false)
				throw new Error(res.error ?? "Failed to load tags");
			return res.data ?? [];
		},
		staleTime: 1000 * 60 * 5,
		enabled,
	});
}

export function useRecentStuff(enabled: boolean = true) {
	const fn = useServerFn(getRecentStuffFn);

	return useQuery({
		queryKey: ["recent", "stuff"],
		queryFn: async () => {
			const res = (await fn()) as {
				success: boolean;
				data?: { id: string; name: string; count: number; slug: string }[];
				error?: string;
			};
			if (!res || res.success === false)
				throw new Error(res.error ?? "Failed to load stuff");
			return res.data ?? [];
		},
		staleTime: 1000 * 60 * 5,
		enabled,
	});
}
