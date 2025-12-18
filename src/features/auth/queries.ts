import { useMutation, useQuery } from "@tanstack/react-query";
import { ZodError } from "zod";
import { useServerFn } from "@tanstack/react-start";
import {
	registerFn,
	getCurrentUserFn,
	loginFn,
	isAuthenticatedFn,
} from "./server";
import type { RegisterInput, LoginInput, AuthResponse } from "./types";

export function useRegisterMutation() {
	const registerMutationFn = useServerFn(registerFn);

	return useMutation({
		mutationFn: async (data: RegisterInput): Promise<AuthResponse> => {
			try {
				const result = await registerMutationFn({ data });
				return result;
			} catch (error) {
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
								if (!validationErrors[key])
									validationErrors[key] = issue.message;
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
				}

				return {
					success: false,
					error: error instanceof Error ? error.message : String(error),
				};
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
		queryFn: async () => {
			const value = await isAuthenticated();
			return value;
		},
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

	return useMutation({
		mutationFn: async (data: LoginInput): Promise<AuthResponse> => {
			try {
				const result = await loginMutationFn({ data });
				return result;
			} catch (error) {
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
								if (!validationErrors[key])
									validationErrors[key] = issue.message;
							}
							return {
								success: false,
								error: "Validation failed",
								errors: validationErrors,
							};
						}
					} catch {
						// ignore
					}
				}

				return {
					success: false,
					error: error instanceof Error ? error.message : String(error),
				};
			}
		},
	});
}
