import {
	useMutation,
	useQuery,
	useQueryClient,
	queryOptions,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
	isAuthenticatedFn,
	getCurrentUserFn,
	logoutFn,
} from "~/features/session/api";

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
