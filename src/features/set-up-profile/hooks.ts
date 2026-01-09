import { useUpdateProfileMutation } from "./queries";
import { useCurrentUser } from "../session/queries";
import { useUploadAvatarMutation } from "./queries";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { ProfileSetupInput } from "./types";
import type { PublicUser } from "./types";

function parseValidationErrors(obj: unknown) {
	if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
	const source = obj as Record<string, unknown>;
	const tryExtract = (candidate: unknown) => {
		if (
			candidate &&
			typeof candidate === "object" &&
			!Array.isArray(candidate)
		) {
			const c = candidate as Record<string, unknown>;
			if (Object.values(c).every((v) => typeof v === "string"))
				return c as Record<string, string>;
		}
		return undefined;
	};
	const fromErrors = tryExtract(source.errors ?? undefined);
	if (fromErrors) return fromErrors;
	const fromError = tryExtract(source.error ?? undefined);
	if (fromError) return fromError;
	return {};
}

function extractErrorMessage(obj: unknown) {
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

export function useSetUpProfile() {
	const mutation = useUpdateProfileMutation();
	const uploadMutation = useUploadAvatarMutation();
	const queryClient = useQueryClient();
	const [localError, setLocalError] = useState<Error | null>(null);
	const [localValidationErrors, setLocalValidationErrors] = useState<
		Record<string, string>
	>({});
	const { user } = useCurrentUser();

	return {
		updateProfile: async (data: ProfileSetupInput) => {
			setLocalError(null);
			setLocalValidationErrors({});

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
				uploadedUrl = uploadResult.data.url;

				if (uploadedUrl) {
					queryClient.setQueryData<PublicUser | null>(["currentUser"], (old) =>
						old ? { ...old, avatarUrl: uploadedUrl } : old,
					);
				}
			}

			const payload: { displayName?: string; avatarUrl?: string } = {};
			if (data.displayName) payload.displayName = data.displayName;
			if (uploadedUrl) payload.avatarUrl = uploadedUrl;
			else if (data.avatarUrl !== undefined)
				payload.avatarUrl = data.avatarUrl ?? undefined;

			try {
				const result = await mutation.mutateAsync(payload);
				if (!result.success) {
					if (previousUser) {
						queryClient.setQueryData(["currentUser"], previousUser);
					}
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
		isPending: mutation.isPending,
		isError: mutation.isError || Boolean(localError),
		error: localError || (mutation.error as Error) || null,
		validationErrors:
			(mutation.data && !mutation.data.success
				? parseValidationErrors(mutation.data)
				: localValidationErrors) || {},
		reset: () => {
			mutation.reset();
			setLocalError(null);
			setLocalValidationErrors({});
		},
		user,
	};
}
