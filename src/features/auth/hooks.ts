import { useRegisterMutation, useLoginMutation } from "./queries";
import type { RegisterInput, LoginInput } from "./types";

export function useRegister() {
	const mutation = useRegisterMutation();

	return {
		register: async (data: RegisterInput) => {
			const result = await mutation.mutateAsync(data);
			if (!result.success) {
				throw new Error(result.error || "Registration failed");
			}
		},
		isPending: mutation.isPending,
		isError: mutation.isError,
		error: mutation.error,
		validationErrors:
			(mutation.data && !mutation.data.success ? mutation.data.errors : {}) ||
			{},
		reset: mutation.reset,
	};
}

export function useLogin() {
	const mutation = useLoginMutation();

	return {
		login: async (data: LoginInput) => {
			const result = await mutation.mutateAsync(data);
			if (!result.success) {
				throw new Error(result.error || "Login failed");
			}
		},
		isPending: mutation.isPending,
		isError: mutation.isError,
		error: mutation.error,
		validationErrors:
			(mutation.data && !mutation.data.success ? mutation.data.errors : {}) ||
			{},
		reset: mutation.reset,
	};
}
