import { useState, useEffect } from "react";
import { useCreateRatingMutation, useUploadImageMutation } from "./queries";
import { useStuffSearchQuery, useTagSearchQuery } from "./queries";
import type { CreateRatingInput } from "./types";

export function useDebounce<T>(value: T, delay: number = 300): T {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => clearTimeout(handler);
	}, [value, delay]);

	return debouncedValue;
}

export function useStuffSearch(query: string) {
	const debouncedQuery = useDebounce(query, 300);
	return useStuffSearchQuery(debouncedQuery);
}

export function useTagSearch(query: string) {
	const debouncedQuery = useDebounce(query, 300);
	return useTagSearchQuery(debouncedQuery);
}

type CreateRatingHookInput = Omit<CreateRatingInput, "images"> & {
	images?: File[];
};

export function useCreateRating() {
	const createMutation = useCreateRatingMutation();
	const uploadMutation = useUploadImageMutation();

	return {
		createRating: async (input: CreateRatingHookInput) => {
			const imageKeys: string[] = [];

			if (input.images && input.images.length > 0) {
				const uploadPromises = input.images.map((file) =>
					uploadMutation.mutateAsync(file),
				);
				const results = await Promise.all(uploadPromises);
				const firstError = results.find((r) => !r.success);

				if (firstError && !firstError.success) {
					throw new Error(firstError.error || "Failed to upload images");
				}

				results.forEach((r) => {
					if (r.success) {
						imageKeys.push(r.data.key);
					}
				});
			}

			const ratingInput: CreateRatingInput = {
				...input,
				images: imageKeys,
			};

			const result = await createMutation.mutateAsync(ratingInput);

			if (!result.success) {
				throw new Error(result.error || "Failed to create rating");
			}
		},
		isPending: createMutation.isPending || uploadMutation.isPending,
		error: createMutation.error || uploadMutation.error,
		validationErrors:
			(createMutation.data && !createMutation.data.success
				? createMutation.data.fieldErrors
				: {}) || {},
		reset: () => {
			createMutation.reset();
			uploadMutation.reset();
		},
	};
}
