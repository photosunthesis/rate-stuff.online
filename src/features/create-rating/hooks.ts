import { useState, useEffect } from "react";
import {
	useCreateRatingMutation,
	useUploadImageMutation,
	useUpdateRatingImagesMutation,
} from "./queries";
import { useStuffSearchQuery, useTagSearchQuery } from "./queries";
import type { CreateRatingInput } from "./types";

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

type CreateRatingHookInput = Omit<CreateRatingInput, "images"> & {
	images?: File[];
};

export function useCreateRating() {
	const createMutation = useCreateRatingMutation();
	const uploadMutation = useUploadImageMutation();
	const updateImagesMutation = useUpdateRatingImagesMutation();

	function extractValidationErrors(payload: unknown): Record<string, string> {
		if (!payload || typeof payload !== "object" || Array.isArray(payload))
			return {};
		const obj = payload as Record<string, unknown>;
		const candidate = obj.fieldErrors ?? obj.errors ?? obj.error ?? undefined;
		if (!candidate || typeof candidate !== "object" || Array.isArray(candidate))
			return {};
		const c = candidate as Record<string, unknown>;
		const isStringMap = Object.values(c).every((v) => typeof v === "string");
		return isStringMap ? (c as Record<string, string>) : {};
	}

	function normalizeError(err: unknown): {
		errorMessage?: string;
		errors?: Record<string, string>;
	} {
		if (!err) return {};
		if (err instanceof Error) {
			const msg = err.message ?? "";
			try {
				const parsed = JSON.parse(msg);
				return normalizeError(parsed);
			} catch {
				return { errorMessage: msg };
			}
		}
		if (typeof err === "string") {
			try {
				const parsed = JSON.parse(err);
				return normalizeError(parsed);
			} catch {
				return { errorMessage: err };
			}
		}
		if (typeof err === "object" && err !== null && !Array.isArray(err)) {
			const o = err as Record<string, unknown>;
			const message =
				typeof o.errorMessage === "string"
					? o.errorMessage
					: typeof o.error === "string"
						? o.error
						: typeof o.message === "string"
							? o.message
							: undefined;
			const errors = extractValidationErrors(o);
			return {
				errorMessage: message,
				errors: Object.keys(errors).length ? errors : undefined,
			};
		}
		return { errorMessage: String(err) };
	}

	const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(
		null,
	);
	const [localValidationErrors, setLocalValidationErrors] = useState<
		Record<string, string>
	>({});

	return {
		createRating: async (input: CreateRatingHookInput) => {
			setLocalErrorMessage(null);
			setLocalValidationErrors({});

			const ratingInput: CreateRatingInput = {
				...input,
				content: normalizeParagraphBreaks(input.content),
				images: [],
			};

			try {
				const result = await createMutation.mutateAsync(ratingInput);

				if (!result.success || !result.data) {
					const validationErrors = extractValidationErrors(result);
					setLocalValidationErrors(validationErrors);
					const msg =
						(result as unknown as { errorMessage?: string }).errorMessage ??
						"Failed to create rating";
					setLocalErrorMessage(msg);
					throw new Error(msg);
				}

				const ratingId = result.data.id;

				const imageUrls: string[] = [];

				if (input.images && input.images.length > 0) {
					for (const file of input.images) {
						try {
							const result = await uploadMutation.mutateAsync({
								file,
								ratingId,
							});
							imageUrls.push(result.url);
						} catch (e) {
							const info = normalizeError(e);
							if (info.errors) setLocalValidationErrors(info.errors);
							const msg =
								info.errorMessage ??
								(e instanceof Error ? e.message : String(e));
							setLocalErrorMessage(msg);
							throw new Error(msg);
						}
					}
				}

				if (imageUrls.length > 0) {
					await updateImagesMutation.mutateAsync({
						ratingId,
						images: imageUrls,
					});
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
