import {
	useMutation,
	useQuery,
	useQueryClient,
	queryOptions,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
	registerFn,
	getCurrentUserFn,
	loginFn,
	isAuthenticatedFn,
	logoutFn,
	updateProfileFn,
	getProfileSummaryFn,
} from "./api";
import type { UpdateProfileResponse } from "./types";
import type { RegisterInput, LoginInput } from "./types";

export const isAuthenticatedQueryOptions = () =>
	queryOptions({
		queryKey: ["isAuthenticated"],
		queryFn: () => isAuthenticatedFn(),
		staleTime: 1000 * 60 * 5,
		gcTime: 1000 * 60 * 10,
	});

export const currentUserQueryOptions = () =>
	queryOptions({
		queryKey: ["currentUser"],
		queryFn: () => getCurrentUserFn(),
		staleTime: 0,
		gcTime: 1000 * 60 * 60,
	});

export function useRegisterMutation() {
	const registerMutationFn = useServerFn(registerFn);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: RegisterInput) => registerMutationFn({ data }),
		onSuccess: (data) => {
			if (data.success && data.user) {
				queryClient.setQueryData(["isAuthenticated"], true);
				queryClient.setQueryData(["currentUser"], data.user);
				queryClient.invalidateQueries({ queryKey: ["isAuthenticated"] });
				queryClient.invalidateQueries({ queryKey: ["currentUser"] });
			}
		},
	});
}

export function useCurrentUserQuery() {
	return useQuery(currentUserQueryOptions());
}

export function useIsAuthenticatedQuery() {
	return useQuery(isAuthenticatedQueryOptions());
}

export function useIsAuthenticated() {
	const query = useIsAuthenticatedQuery();
	return {
		isAuthenticated: query.data ?? false,
		isLoading: query.isLoading,
		isError: query.isError,
		refetch: query.refetch,
	};
}

export const profileSummaryQueryOptions = () =>
	queryOptions({
		queryKey: ["profileSummary"],
		queryFn: () => getProfileSummaryFn(),
		staleTime: 1000 * 60 * 1, // 1 minute
		gcTime: 1000 * 60 * 5,
	});

export function useProfileSummary() {
	return useQuery(profileSummaryQueryOptions());
}

export function useCurrentUser() {
	const query = useCurrentUserQuery();
	return {
		user: query.data ?? null,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
		isAuthenticated: !!query.data,
	};
}

export function useLoginMutation() {
	const loginMutationFn = useServerFn(loginFn);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: LoginInput) => loginMutationFn({ data }),
		onSuccess: (data) => {
			if (data.success && data.user) {
				queryClient.setQueryData(["isAuthenticated"], true);
				queryClient.setQueryData(["currentUser"], data.user);
				queryClient.invalidateQueries({ queryKey: ["isAuthenticated"] });
				queryClient.invalidateQueries({ queryKey: ["currentUser"] });
			}
		},
	});
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

export function useLogoutMutation() {
	const logoutMutationFn = useServerFn(logoutFn);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => logoutMutationFn(),
		onSuccess: (data) => {
			if (data.success) {
				queryClient.setQueryData(["isAuthenticated"], false);
				queryClient.setQueryData(["currentUser"], null);
				queryClient.invalidateQueries({ queryKey: ["isAuthenticated"] });
				queryClient.invalidateQueries({ queryKey: ["currentUser"] });
			}
		},
	});
}
