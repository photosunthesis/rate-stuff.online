import {
	useMutation,
	useQuery,
	useQueryClient,
	queryOptions,
	keepPreviousData,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
	createRatingFn,
	uploadImageFn,
	updateRatingImagesFn,
	searchStuffFn,
	searchTagsFn,
} from "./api";
import type { CreateRatingInput } from "./types";

export function useCreateRatingMutation() {
	const createRatingMutationFn = useServerFn(createRatingFn);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateRatingInput) => createRatingMutationFn({ data }),
		onSuccess: (data) => {
			if (data && (data as { success?: boolean }).success) {
				queryClient.invalidateQueries({ queryKey: ratingKeys.all });
			}
		},
		onError: () => {
			// no-op: let calling code handle errors
		},
	});
}

export function useUploadImageMutation() {
	const uploadImageMutationFn = useServerFn(uploadImageFn);
	return useMutation({
		mutationFn: async ({
			file,
			ratingId,
		}: {
			file: File;
			ratingId: string;
		}) => {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("ratingId", ratingId);
			return uploadImageMutationFn({ data: formData });
		},
	});
}

export function useUpdateRatingImagesMutation() {
	const updateFn = useServerFn(updateRatingImagesFn);
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			ratingId,
			images,
		}: {
			ratingId: string;
			images: string[];
		}) => {
			return updateFn({ data: { ratingId, images } });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ratingKeys.all });
		},
	});
}

export const ratingKeys = {
	all: ["ratings"] as const,
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
