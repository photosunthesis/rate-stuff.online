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
	getUploadUrlFn,
	updateRatingFn,
	deleteRatingFn,
} from "../api/create";
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
		onSuccess: async (data) => {
			const result = data as {
				success?: boolean;
				data?: {
					stuff?: { id: string; name: string; slug: string } | null;
				} | null;
			};
			if (!result?.success) return;

			const createdStuff = result.data?.stuff ?? null;

			// Optimistically surface the just-rated stuff at the front of the
			// recency slot so it shows instantly. The awaited DB-direct refetch
			// below reconciles to the same recency ordering, so there's no flicker.
			if (createdStuff) {
				queryClient.setQueryData<{ id: string; name: string; slug: string }[]>(
					["recent", "stuff", "latest"],
					(old) => {
						const rest = (old ?? []).filter((s) => s.id !== createdStuff.id);
						return [createdStuff, ...rest].slice(0, 5);
					},
				);
			}

			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ratingKeys.all }),
				// Prefix-matches both ["recent","stuff"] (trending, KV-cached) and
				// ["recent","stuff","latest"] (recency, DB-direct & fresh).
				queryClient.invalidateQueries({ queryKey: ["recent", "stuff"] }),
				queryClient.invalidateQueries({ queryKey: ["recent", "tags"] }),
				// The stuff detail page's rating list isn't under ratingKeys.all and
				// has refetchOnMount:false, so force-refetch it (active or not) to keep
				// a stuff page correct when a rating is created from it.
				createdStuff
					? queryClient.invalidateQueries({
							queryKey: ["stuff", createdStuff.slug, "ratings"],
							refetchType: "all",
						})
					: Promise.resolve(),
			]);
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

			const signed = await getUploadUrl({
				data: {
					ratingId,
					filename: file.name,
					contentType: file.type,
				},
			});

			if (!signed.success || !signed.data) {
				throw new Error(signed.errorMessage || "Failed to get upload url");
			}

			const { key, putUrl, publicUrl } = signed.data;

			const response = await fetch(putUrl, {
				method: "PUT",
				headers: { "Content-Type": file.type },
				body: file,
			});

			if (!response.ok) {
				let message = `Upload failed (${response.status})`;
				try {
					const body = (await response.json()) as { error?: string };
					if (body.error) message = body.error;
				} catch {
					// response wasn't JSON — keep default message
				}
				throw new Error(message);
			}

			return { key, url: publicUrl };
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
