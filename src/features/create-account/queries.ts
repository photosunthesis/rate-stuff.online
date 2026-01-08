import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { registerFn } from "~/features/create-account/api";
import type {
	RegisterInput,
	AuthResponse,
} from "~/features/create-account/types";

export function useRegisterMutation() {
	const registerMutationFn = useServerFn(registerFn);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: RegisterInput) => registerMutationFn({ data }),
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
