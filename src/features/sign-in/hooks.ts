import { useLoginMutation } from "~/features/sign-in/queries";
import type { LoginInput } from "~/features/sign-in/types";

export function useSignIn() {
	const mutation = useLoginMutation();

	return {
		signIn: async (data: LoginInput) => {
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
