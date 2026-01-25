import {
	useMutation,
	useQuery,
	useQueryClient,
	queryOptions,
	keepPreviousData,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import {
	createRatingFn,
	updateRatingImagesFn,
	searchStuffFn,
	searchTagsFn,
	uploadRatingImageFn,
	updateRatingFn,
	deleteRatingFn,
} from "../functions/create";
import {
	MAX_FILE_SIZE,
	ALLOWED_CONTENT_TYPES,
} from "~/infrastructure/file-storage/service";

import type { CreateRatingInput } from "../types/create";

export function useCreateRatingMutation() {
	const createRatingMutationFn = useServerFn(createRatingFn);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateRatingInput) => createRatingMutationFn({ data }),
		onSuccess: (data) => {
			if (data && (data as { success?: boolean }).success) {
				queryClient.invalidateQueries({ queryKey: ratingKeys.all });
				queryClient.invalidateQueries({ queryKey: ["recent", "stuff"] });
				queryClient.invalidateQueries({ queryKey: ["recent", "tags"] });
			}
		},
	});
}

export function useUploadImageMutation() {
	const uploadImageFn = useServerFn(uploadRatingImageFn);
	return useMutation({
		mutationFn: async ({
			file,
			ratingId,
		}: {
			file: File;
			ratingId: string;
		}) => {
			if (file.size > MAX_FILE_SIZE) {
				throw new Error(
					`File "${file.name}" is too large. Max size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
				);
			}

			if (!ALLOWED_CONTENT_TYPES.includes(file.type.toLowerCase())) {
				throw new Error(
					`File "${file.name}" has an unsupported type: ${file.type}`,
				);
			}

			const formData = new FormData();
			formData.append("file", file);
			formData.append("ratingId", ratingId);

			const result = await uploadImageFn({ data: formData });

			if (!result.success || !result.url) {
				throw new Error(result.errorMessage || "Upload failed");
			}

			return { key: result.key, url: result.url };
		},
	});
}

export function useUpdateRatingMutation() {
	const updateRatingMutationFn = useServerFn(updateRatingFn);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateRatingMutationFn,
		onSuccess: (data) => {
			if (data && (data as { success?: boolean }).success) {
				queryClient.invalidateQueries({ queryKey: ratingKeys.all });
			}
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

export function useDeleteRatingMutation() {
	const deleteRatingMutationFn = useServerFn(deleteRatingFn);
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: (data: { ratingId: string }) =>
			deleteRatingMutationFn({ data }),
		onSuccess: (data) => {
			if (data && (data as { success?: boolean }).success) {
				queryClient.invalidateQueries({ queryKey: ratingKeys.all });
				queryClient.invalidateQueries({ queryKey: ["recent", "stuff"] });
				queryClient.invalidateQueries({ queryKey: ["recent", "tags"] });
				router.navigate({ to: "/" });
			}
		},
	});
}
