import {
	useMutation,
	useQuery,
	useQueryClient,
	queryOptions,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
	updateProfileFn,
	getProfileSummaryFn,
} from "~/features/profile-setup/api";
import type { UpdateProfileResponse } from "~/features/profile-setup/types";

export const profileSummaryQueryOptions = () =>
	queryOptions({
		queryKey: ["profileSummary"],
		queryFn: () => getProfileSummaryFn(),
		staleTime: 1000 * 60 * 1,
		gcTime: 1000 * 60 * 5,
	});

export function useProfileSummary() {
	return useQuery(profileSummaryQueryOptions());
}

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
