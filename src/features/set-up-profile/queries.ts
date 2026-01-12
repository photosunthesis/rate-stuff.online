import {
	useMutation,
	useQueryClient,
	useQuery,
	queryOptions,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { uploadAvatarFn } from "~/features/set-up-profile/api";
import { getUserByUsernameFn } from "~/features/set-up-profile/api";
import type { PublicUser } from "~/features/set-up-profile/types";
import authClient from "~/lib/auth/auth-client";
import { authQueryOptions } from "~/lib/auth/queries";

export function useUpdateProfileMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: { name?: string; image?: string }) => {
			const payload: { name?: string; image?: string } = {};

			if (data.name) payload.name = data.name;
			if (data.image) payload.image = data.image;

			const res = await authClient.updateUser(payload);

			if (res.error) {
				return {
					success: false,
					error: res.error.message || "Profile update failed",
				};
			}

			const user = await queryClient.ensureQueryData({
				...authQueryOptions(),
				revalidateIfStale: true,
			});

			return {
				success: true,
				user: {
					id: user?.id,
					username: user?.username ?? "",
					name: user?.name ?? null,
					image: user?.image ?? null,
				},
			};
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
