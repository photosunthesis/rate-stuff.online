import {
	useRegisterMutation,
	useLoginMutation,
	useUpdateProfileMutation,
} from "./queries";
import { useUploadImageMutation } from "~/features/ratings/queries";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { PublicUser } from "./types";
import type {
	RegisterInput,
	LoginInput,
	ProfileSetupInput,
	ValidationErrors,
} from "./types";

function parseValidationErrors(obj: unknown): ValidationErrors {
	if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
	const source = obj as Record<string, unknown>;
	const tryExtract = (candidate: unknown): ValidationErrors | undefined => {
		if (
			candidate &&
			typeof candidate === "object" &&
			!Array.isArray(candidate)
		) {
			const c = candidate as Record<string, unknown>;
			if (Object.values(c).every((v) => typeof v === "string"))
				return c as ValidationErrors;
		}
		return undefined;
	};
	const fromErrors = tryExtract(source.errors ?? undefined);
	if (fromErrors) return fromErrors;
	const fromError = tryExtract(source.error ?? undefined);
	if (fromError) return fromError;
	return {};
}

function extractErrorMessage(obj: unknown): string | undefined {
	if (!obj || typeof obj !== "object" || Array.isArray(obj)) return undefined;
	const o = obj as Record<string, unknown>;
	if (typeof o.error === "string") return o.error;
	if (typeof o.error === "object" && o.error !== null) {
		const errObj = o.error as Record<string, unknown>;
		if (typeof errObj.message === "string") return errObj.message;
	}
	if (typeof o.errors === "string") return o.errors;
	return undefined;
}

export function useRegister() {
	const mutation = useRegisterMutation();

	return {
		register: async (data: RegisterInput) => {
			const result = await mutation.mutateAsync(data);
			if (!result.success) {
				throw new Error(result.error || "Registration failed");
			}
		},
		isPending: mutation.isPending,
		isError: mutation.isError,
		error: mutation.error,
		validationErrors:
			(mutation.data && !mutation.data.success ? mutation.data.errors : {}) ||
			{},
		reset: mutation.reset,
	};
}

export function useLogin() {
	const mutation = useLoginMutation();

	return {
		login: async (data: LoginInput) => {
			const result = await mutation.mutateAsync(data);
			if (!result.success) {
				throw new Error(result.error || "Login failed");
			}
		},
		isPending: mutation.isPending,
		isError: mutation.isError,
		error: mutation.error,
		validationErrors:
			(mutation.data && !mutation.data.success ? mutation.data.errors : {}) ||
			{},
		reset: mutation.reset,
	};
}

export function useUpdateProfile() {
	const mutation = useUpdateProfileMutation();
	const uploadMutation = useUploadImageMutation();
	const queryClient = useQueryClient();
	const [localError, setLocalError] = useState<Error | null>(null);
	const [localValidationErrors, setLocalValidationErrors] =
		useState<ValidationErrors>({});

	return {
		update: async (data: ProfileSetupInput) => {
			setLocalError(null);
			setLocalValidationErrors({});

			let avatarKey: string | undefined;
			let uploadedUrl: string | undefined;

			const previousUser = queryClient.getQueryData<PublicUser | null>([
				"currentUser",
			]);

			if (data.avatar instanceof File) {
				const uploadResult = await uploadMutation.mutateAsync(data.avatar);
				if (!uploadResult.success) {
					const err = new Error(
						uploadResult.error || "Failed to upload avatar",
					);
					setLocalError(err);
					throw err;
				}
				avatarKey = uploadResult.data.key;
				uploadedUrl = uploadResult.data.url;

				if (uploadedUrl) {
					queryClient.setQueryData<PublicUser | null>(["currentUser"], (old) =>
						old ? { ...old, avatarUrl: uploadedUrl } : old,
					);
				}
			}

			const payload: { displayName?: string; avatarKey?: string } = {};
			if (data.displayName) payload.displayName = data.displayName;
			if (avatarKey) payload.avatarKey = avatarKey;

			try {
				const result = await mutation.mutateAsync(payload);
				if (!result.success) {
					// rollback optimistic avatarUrl if present
					if (previousUser) {
						queryClient.setQueryData(["currentUser"], previousUser);
					}
					// Normalize validation errors and throw an error with message
					const validationErrors = parseValidationErrors(result);
					setLocalValidationErrors(validationErrors);
					const errMessage =
						extractErrorMessage(result) ?? "Failed to update profile";
					const err = new Error(errMessage);
					setLocalError(err);
					throw err;
				}
				return result;
			} catch (err) {
				if (previousUser) {
					queryClient.setQueryData(["currentUser"], previousUser);
				}
				if (err instanceof Error) setLocalError(err);
				throw err;
			}
		},
		isPending: mutation.isPending || uploadMutation.isPending,
		isError: mutation.isError || uploadMutation.isError || Boolean(localError),
		error:
			localError ||
			(mutation.error as Error) ||
			(uploadMutation.error as Error) ||
			null,
		// Normalize validation errors from mutation response in a type-safe way
		validationErrors:
			(mutation.data && !mutation.data.success
				? parseValidationErrors(mutation.data)
				: localValidationErrors) || {},

		reset: () => {
			mutation.reset();
			uploadMutation.reset();
			setLocalError(null);
			setLocalValidationErrors({});
		},
	};
}
