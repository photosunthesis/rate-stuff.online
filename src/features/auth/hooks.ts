import {
	useRegisterMutation,
	useLoginMutation,
	useUpdateProfileMutation,
} from "./queries";
import { useUploadImageMutation } from "~/features/ratings/queries";
import type {
	RegisterInput,
	LoginInput,
	ProfileSetupInput,
	ValidationErrors,
} from "./types";

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

	return {
		update: async (data: ProfileSetupInput) => {
			let avatarKey: string | undefined;
			if (data.avatar instanceof File) {
				const uploadResult = await uploadMutation.mutateAsync(data.avatar);
				if (!uploadResult.success) {
					throw new Error(uploadResult.error || "Failed to upload avatar");
				}
				avatarKey = uploadResult.data.key;
			}

			const payload: { displayName?: string; avatarKey?: string } = {};
			if (data.displayName) payload.displayName = data.displayName;
			if (avatarKey) payload.avatarKey = avatarKey;

			const result = await mutation.mutateAsync(payload);
			if (!result.success) {
				throw new Error(result.error || "Failed to update profile");
			}
		},
		isPending: mutation.isPending || uploadMutation.isPending,
		isError: mutation.isError || uploadMutation.isError,
		error: (mutation.error as Error) || (uploadMutation.error as Error) || null,
		validationErrors: {} as ValidationErrors,
		reset: () => {
			mutation.reset();
			uploadMutation.reset();
		},
	};
}
