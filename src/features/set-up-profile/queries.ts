import {
	useMutation,
	useQueryClient,
	useQuery,
	queryOptions,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { updateProfileFn } from "~/features/set-up-profile/api";
import { uploadAvatarFn } from "~/features/set-up-profile/api";
import { getUserByUsernameFn } from "~/features/set-up-profile/api";
import type { UpdateProfileResponse } from "~/features/set-up-profile/types";
import type { PublicUser } from "~/features/set-up-profile/types";

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

export const userQueryOptions = (username?: string) =>
	queryOptions({
		queryKey: username ? ["user", username] : ["user", undefined],
		queryFn: async () => {
			if (!username) return null;
			const res = (await getUserByUsernameFn({ data: { username } })) as {
				success: boolean;
				data?: (PublicUser & { createdAt?: string | null }) | null;
				error?: string;
			};
			if (!res.success) {
				const err = res.error ?? "Failed to load user";
				if (err.toLowerCase().includes("not found")) return null;
				throw new Error(err);
			}
			return res.data ?? null;
		},
		staleTime: 0,
		gcTime: 1000 * 60 * 10,
	});

export function usePublicUser(username?: string) {
	return useQuery(userQueryOptions(username));
}
