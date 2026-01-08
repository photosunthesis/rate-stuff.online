import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { updateProfileFn } from "~/features/profile-setup/api";
import type { UpdateProfileResponse } from "~/features/profile-setup/types";

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
