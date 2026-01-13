import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import {
	createAccountFn,
	getCurrentUserFn,
	getUserByUsernameFn,
	updateUserProfileFn,
	uploadAvatarFn,
} from "./api";
import { useServerFn } from "@tanstack/react-start";
import type { PublicUser } from "./types";

export function useSignUpMutation() {
	const createAccountMutationFn = useServerFn(createAccountFn);

	return useMutation({
		mutationFn: async (data: {
			email: string;
			password: string;
			username: string;
			inviteCode: string;
		}) => createAccountMutationFn({ data }),
	});
}

export function useUpdateProfileMutation() {
	const updateProfileMutationFn = useServerFn(updateUserProfileFn);

	return useMutation({
		mutationFn: async (data: { name?: string; image?: string }) =>
			updateProfileMutationFn({ data }),
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

export const userQueryOptions = (username: string) =>
	queryOptions({
		queryKey: ["user", username],
		queryFn: async () => {
			const res = (await getUserByUsernameFn({ data: { username } })) as {
				success: boolean;
				data?: PublicUser;
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

export function usePublicUser(username: string) {
	return useQuery(userQueryOptions(username));
}

export const authQueryOptions = () =>
	queryOptions({
		queryKey: ["user"],
		queryFn: ({ signal }) => getCurrentUserFn({ signal }),
	});

export type AuthQueryResult = Awaited<ReturnType<typeof getCurrentUserFn>>;
