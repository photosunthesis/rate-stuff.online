import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { loginFn } from "~/features/sign-in/api";
import type { LoginInput, AuthResponse } from "~/features/sign-in/types";

export function useLoginMutation() {
	const loginMutationFn = useServerFn(loginFn);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: LoginInput) => loginMutationFn({ data }),
		onSuccess: (data: AuthResponse) => {
			if (data.success && data.user) {
				queryClient.setQueryData(["isAuthenticated"], true);
				queryClient.setQueryData(["currentUser"], data.user);
				queryClient.invalidateQueries({ queryKey: ["isAuthenticated"] });
				queryClient.invalidateQueries({ queryKey: ["currentUser"] });
			}
		},
	});
}
