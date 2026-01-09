import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { updateProfileFn } from "~/features/set-up-profile/api";
import { uploadAvatarFn } from "~/features/set-up-profile/api";
import type { UpdateProfileResponse } from "~/features/set-up-profile/types";

export function useUpdateProfileMutation() {
	const updateProfileFnRef = useServerFn(updateProfileFn);
	const queryClient = useQueryClient();

	return useMutation<
		UpdateProfileResponse,
		Error,
		{ displayName?: string; avatarUrl?: string }
	>({
		mutationFn: async (data) => {
			return updateProfileFnRef({ data });
		},
		onSuccess: (data) => {
			if (data?.success && data.user) {
				queryClient.setQueryData(["currentUser"], data.user);
				queryClient.invalidateQueries({ queryKey: ["currentUser"] });
			}
		},
	});
}

export function useUploadAvatarMutation() {
	const uploadAvatarMutationFn = useServerFn(uploadAvatarFn);
	return useMutation({
		mutationFn: async (file: File) => {
			const formData = new FormData();
			formData.append("file", file);
			return uploadAvatarMutationFn({ data: formData });
		},
	});
}
