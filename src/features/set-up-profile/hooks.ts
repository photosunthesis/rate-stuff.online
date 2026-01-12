import { useUpdateProfileMutation, useUploadAvatarMutation } from "./queries";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { SetUpProfileInput, PublicUser } from "./types";
import { extractValidationErrors, normalizeError } from "~/utils/errors";
import { authQueryOptions } from "~/lib/auth/queries";

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

					// Invalidate auth queries to refresh auth state
					if (uploadedUrl) {
						queryClient.removeQueries({
							queryKey: authQueryOptions().queryKey,
						});
					}
				} catch (e) {
					const info = normalizeError(e);
					if (info.errors) setLocalValidationErrors(info.errors);
					const msg = info.errorMessage ?? "Failed to upload avatar";
					setLocalErrorMessage(msg);
					throw new Error(msg);
				}
			}

			const payload: { name?: string; image?: string } = {};
			if (data.name) payload.name = data.name;
			if (uploadedUrl) payload.image = uploadedUrl;
			else if (data.image !== undefined)
				payload.image = data.image ?? undefined;

			try {
				const result = await mutation.mutateAsync(payload);
				if (!result.success) {
					if (previousUser) {
						queryClient.removeQueries({
							queryKey: authQueryOptions().queryKey,
						});
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
					queryClient.removeQueries({
						queryKey: authQueryOptions().queryKey,
					});
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
	};
}
