import { useRegisterMutation } from "~/features/create-account/queries";
import type { RegisterInput } from "~/features/create-account/types";

export function useCreateAccount() {
	const mutation = useRegisterMutation();

	return {
		createAccount: async (data: RegisterInput) => {
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
