import { useState, useEffect } from "react";
import { useCreateRatingMutation, useUploadImageMutation } from "./queries";
import { useStuffSearchQuery, useTagSearchQuery } from "./queries";
import { extractValidationErrors, normalizeError } from "~/lib/utils/errors";
import type { createRatingSchema } from "./types";
import type { z } from "zod";

function normalizeParagraphBreaks(md: string) {
	if (!md) return "";
	let s = md.replace(/\r\n/g, "\n");
	s = s.replace(/\n{3,}/g, "\n\n");
	s = s.replace(/([^\n])\n([^\n])/g, "$1\n\n$2");
	return s;
}

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

export function useCreateRating() {
	const createMutation = useCreateRatingMutation();
	const uploadMutation = useUploadImageMutation();

	const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(
		null,
	);
	const [localValidationErrors, setLocalValidationErrors] = useState<
		Record<string, string>
	>({});

	return {
		createRating: async (
			input: Omit<z.infer<typeof createRatingSchema>, "images"> & {
				images?: File[];
			},
		) => {
			setLocalErrorMessage(null);
			setLocalValidationErrors({});

			const ratingId = crypto.randomUUID();
			const ratingInput = {
				...input,
				content: normalizeParagraphBreaks(input.content),
				images: [],
				id: ratingId,
			};

			const imageUrls: string[] = [];

			try {
				if (input.images && input.images.length > 0) {
					const uploads = input.images.map((file) =>
						uploadMutation.mutateAsync({ file, ratingId }).then(
							(result) => result.url,
							(e) => {
								const info = normalizeError(e);
								if (info.errors)
									setLocalValidationErrors((prev) => ({
										...prev,
										...info.errors,
									}));
								const msg =
									info.errorMessage ??
									(e instanceof Error ? e.message : String(e));
								setLocalErrorMessage(msg);
								throw e;
							},
						),
					);

					const urls = await Promise.all(uploads);
					imageUrls.push(...urls);
				}

				const finalInput = { ...ratingInput, images: imageUrls };
				const result = (await createMutation.mutateAsync(finalInput)) as {
					success?: boolean;
					data?: { id: string } | null;
					errorMessage?: string;
					errors?: Record<string, string>;
				};

				if (!result.success || !result.data) {
					const validationErrors = extractValidationErrors(result);
					setLocalValidationErrors(validationErrors);
					const msg = result.errorMessage ?? "Failed to create rating";
					setLocalErrorMessage(msg);
					throw new Error(msg);
				}
			} catch (e) {
				const info = normalizeError(e);
				if (info.errors) setLocalValidationErrors(info.errors);
				const msg =
					info.errorMessage ?? (e instanceof Error ? e.message : String(e));
				setLocalErrorMessage(msg);
				throw new Error(msg);
			}
		},
		isPending: createMutation.isPending || uploadMutation.isPending,
		errorMessage:
			localErrorMessage ??
			(createMutation.data &&
			!(createMutation.data as { success?: boolean }).success
				? (createMutation.data as unknown as { errorMessage?: string })
						.errorMessage
				: undefined),
		validationErrors:
			(createMutation.data
				? extractValidationErrors(createMutation.data)
				: localValidationErrors) || {},
		reset: () => {
			createMutation.reset();
			uploadMutation.reset();
			setLocalErrorMessage(null);
			setLocalValidationErrors({});
		},
	};
}
