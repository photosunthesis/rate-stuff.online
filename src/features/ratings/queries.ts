import {
	useMutation,
	useQuery,
	useQueryClient,
	queryOptions,
	keepPreviousData,
	useInfiniteQuery,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
	createRatingFn,
	searchStuffFn,
	searchTagsFn,
	uploadImageFn,
	getUserRatingsFn,
	getFeedRatingsFn,
} from "./api";
import type { CreateRatingInput } from "./types";

export const ratingKeys = {
	all: ["ratings"] as const,
	feed: () => [...ratingKeys.all, "feed"] as const,
	mine: () => [...ratingKeys.all, "mine"] as const,
	stuff: () => [...ratingKeys.all, "stuff"] as const,
	stuffSearch: (query: string) =>
		[...ratingKeys.stuff(), "search", query] as const,
	tags: () => [...ratingKeys.all, "tags"] as const,
	tagsSearch: (query: string) =>
		[...ratingKeys.tags(), "search", query] as const,
};

export const stuffSearchQueryOptions = (query: string) =>
	queryOptions({
		queryKey: ratingKeys.stuffSearch(query),
		queryFn: () => searchStuffFn({ data: { query } }),
		enabled: query.length > 0,
		placeholderData: keepPreviousData,
	});

export const tagSearchQueryOptions = (query: string) =>
	queryOptions({
		queryKey: ratingKeys.tagsSearch(query),
		queryFn: () => searchTagsFn({ data: { query } }),
		enabled: query.length > 0,
		placeholderData: keepPreviousData,
	});

export function useStuffSearchQuery(query: string) {
	return useQuery(stuffSearchQueryOptions(query));
}

export function useTagSearchQuery(query: string) {
	return useQuery(tagSearchQueryOptions(query));
}

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

export function useCreateRatingMutation() {
	const createRatingMutationFn = useServerFn(createRatingFn);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateRatingInput) => createRatingMutationFn({ data }),
		onSuccess: (data) => {
			if (data.success) {
				queryClient.invalidateQueries({ queryKey: ratingKeys.all });
			}
		},
	});
}

export function useUploadImageMutation() {
	const uploadImageMutationFn = useServerFn(uploadImageFn);

	return useMutation({
		mutationFn: async (file: File) => {
			const formData = new FormData();
			formData.append("file", file);
			return uploadImageMutationFn({ data: formData });
		},
	});
}
