import { useUpdateProfileMutation, useUploadAvatarMutation } from "./queries";
import { useCurrentUser } from "../session/queries";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { ProfileSetupInput, PublicUser } from "./types";

function extractValidationErrors(payload: unknown): Record<string, string> {
	if (!payload || typeof payload !== "object" || Array.isArray(payload))
		return {};
	const obj = payload as Record<string, unknown>;
	const candidate = obj.errors ?? obj.error ?? undefined;
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
		updateProfile: async (data: ProfileSetupInput) => {
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
