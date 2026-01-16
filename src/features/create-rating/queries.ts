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
	getUploadUrlFn,
	updateRatingImagesFn,
	searchStuffFn,
	searchTagsFn,
} from "./functions";
import {
	MAX_FILE_SIZE,
	ALLOWED_CONTENT_TYPES,
} from "~/features/file-storage/service";

import type { CreateRatingInput } from "./types";

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
	const getUploadUrl = useServerFn(getUploadUrlFn);
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

			const presign = await getUploadUrl({
				data: { ratingId, filename: file.name, contentType: file.type },
			});
			if (!presign || !presign.success) {
				throw new Error("Failed to get upload url");
			}

			const payload = presign.data;
			const putResp = await fetch(payload.putUrl, {
				method: "PUT",
				credentials: "include",
				body: file,
				headers: { "Content-Type": file.type },
			});

			if (!putResp.ok) throw new Error("Upload failed");

			// Sometimes the PUT response is XML or empty, not JSON
			const jsonResp = (await putResp.json().catch(() => null)) as {
				url?: string;
			} | null;
			const publicUrl = jsonResp?.url ?? payload.publicUrl;
			return { key: payload.key, url: publicUrl };
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
