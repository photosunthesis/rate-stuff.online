import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ZodError } from "zod";
import { useServerFn } from "@tanstack/react-start";
import {
	registerFn,
	getCurrentUserFn,
	loginFn,
	isAuthenticatedFn,
	logoutFn,
} from "./server";

export { registerFn, getCurrentUserFn, loginFn, isAuthenticatedFn, logoutFn };
import type { RegisterInput, LoginInput, AuthResponse } from "./types";

function handleAuthError(error: unknown): AuthResponse {
	if (error instanceof ZodError) {
		const validationErrors: Record<string, string> = {};
		for (const issue of error.issues) {
			const key = issue.path?.length ? String(issue.path[0]) : "form";
			if (!validationErrors[key]) validationErrors[key] = issue.message;
		}
		return {
			success: false,
			error: "Validation failed",
			errors: validationErrors,
		};
	}

	if (error instanceof Error) {
		try {
			const parsed = JSON.parse(error.message);
			if (Array.isArray(parsed)) {
				const validationErrors: Record<string, string> = {};
				for (const issue of parsed) {
					const key = issue.path?.length ? String(issue.path[0]) : "form";
					if (!validationErrors[key]) validationErrors[key] = issue.message;
				}
				return {
					success: false,
					error: "Validation failed",
					errors: validationErrors,
				};
			}
		} catch {
			// ignore parse errors
		}
		return {
			success: false,
			error: error.message,
		};
	}

	return {
		success: false,
		error: String(error),
	};
}

export function useRegisterMutation() {
	const registerMutationFn = useServerFn(registerFn);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: RegisterInput): Promise<AuthResponse> => {
			try {
				return await registerMutationFn({ data });
			} catch (error) {
				return handleAuthError(error);
			}
		},
		onSuccess: async (data) => {
			if (data.success && data.user) {
				queryClient.setQueryData(["isAuthenticated"], true);
				queryClient.setQueryData(["currentUser"], data.user);
				await Promise.all([
					queryClient.invalidateQueries({ queryKey: ["isAuthenticated"] }),
					queryClient.invalidateQueries({ queryKey: ["currentUser"] }),
				]);
			}
		},
	});
}

export function useCurrentUserQuery() {
	const getCurrentUser = useServerFn(getCurrentUserFn);

	return useQuery({
		queryKey: ["currentUser"],
		queryFn: async () => {
			const user = await getCurrentUser();
			return user;
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
	});
}

export function useIsAuthenticatedQuery() {
	const isAuthenticated = useServerFn(isAuthenticatedFn);

	return useQuery({
		queryKey: ["isAuthenticated"],
		queryFn: () => isAuthenticated(),
		staleTime: 1000 * 30, // 30 seconds
		gcTime: 1000 * 60, // 1 minute
	});
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

export function useLoginMutation() {
	const loginMutationFn = useServerFn(loginFn);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: LoginInput): Promise<AuthResponse> => {
			try {
				return await loginMutationFn({ data });
			} catch (error) {
				return handleAuthError(error);
			}
		},
		onSuccess: async (data) => {
			if (data.success && data.user) {
				queryClient.setQueryData(["isAuthenticated"], true);
				queryClient.setQueryData(["currentUser"], data.user);
				await Promise.all([
					queryClient.invalidateQueries({ queryKey: ["isAuthenticated"] }),
					queryClient.invalidateQueries({ queryKey: ["currentUser"] }),
				]);
			}
		},
	});
}

export function useLogoutMutation() {
	const logoutMutationFn = useServerFn(logoutFn);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			return await logoutMutationFn();
		},
		onSuccess: async (data) => {
			if (data.success) {
				queryClient.setQueryData(["isAuthenticated"], false);
				queryClient.setQueryData(["currentUser"], null);
				await Promise.all([
					queryClient.invalidateQueries({ queryKey: ["isAuthenticated"] }),
					queryClient.invalidateQueries({ queryKey: ["currentUser"] }),
				]);
			}
		},
	});
}
