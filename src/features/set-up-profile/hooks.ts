import { useUpdateProfileMutation, useUploadAvatarMutation } from "./queries";
import { useCurrentUser } from "../session/queries";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { SetUpProfileInput, PublicUser } from "./types";
import { extractValidationErrors, normalizeError } from "~/utils/errors";

export function useSetUpProfile() {
	const mutation = useUpdateProfileMutation();
	const uploadMutation = useUploadAvatarMutation();
	const queryClient = useQueryClient();
	const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(
		null,
	);
	const [localValidationErrors, setLocalValidationErrors] = useState<
		Record<string, string>
	>({});
	const { user } = useCurrentUser();

	return {
		updateProfile: async (data: SetUpProfileInput) => {
			setLocalErrorMessage(null);
			setLocalValidationErrors({});

			let uploadedUrl: string | undefined;

			const previousUser = queryClient.getQueryData<PublicUser | null>([
				"currentUser",
			]);

			if (data.avatar instanceof File) {
				try {
					const uploadResult = await uploadMutation.mutateAsync(data.avatar);
					uploadedUrl = uploadResult.url;
					if (uploadedUrl)
						queryClient.setQueryData<PublicUser | null>(
							["currentUser"],
							(old) => (old ? { ...old, avatarUrl: uploadedUrl } : old),
						);
				} catch (e) {
					const info = normalizeError(e);
					if (info.errors) setLocalValidationErrors(info.errors);
					const msg = info.errorMessage ?? "Failed to upload avatar";
					setLocalErrorMessage(msg);
					throw new Error(msg);
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
					const validationErrors = extractValidationErrors(result);
					setLocalValidationErrors(validationErrors);
					const errMessage =
						(result as unknown as { errorMessage?: string }).errorMessage ??
						"Failed to update profile";
					setLocalErrorMessage(errMessage);
					throw new Error(errMessage);
				}
				return result;
			} catch (e) {
				if (previousUser) {
					queryClient.setQueryData(["currentUser"], previousUser);
				}
				const info = normalizeError(e);
				if (info.errors) setLocalValidationErrors(info.errors);
				const msg =
					info.errorMessage ?? (e instanceof Error ? e.message : String(e));
				setLocalErrorMessage(msg);
				throw new Error(msg);
			}
		},

		isPending: mutation.isPending,
		isError: mutation.isError || Boolean(localErrorMessage),
		errorMessage:
			localErrorMessage ||
			(mutation.data && !mutation.data.success
				? (mutation.data as unknown as { errorMessage?: string }).errorMessage
				: undefined),

		validationErrors:
			(mutation.data && !mutation.data.success
				? extractValidationErrors(mutation.data)
				: localValidationErrors) || {},

		reset: () => {
			mutation.reset();
			setLocalErrorMessage(null);
			setLocalValidationErrors({});
		},

		user,
	};
}
