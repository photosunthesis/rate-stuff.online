import { useRegisterMutation } from "~/features/create-account/queries";
import type { RegisterInput } from "~/features/create-account/types";
import { useState } from "react";
import { extractValidationErrors, normalizeError } from "~/utils/errors";

export function useCreateAccount() {
	const mutation = useRegisterMutation();
	const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(
		null,
	);
	const [localValidationErrors, setLocalValidationErrors] = useState<
		Record<string, string>
	>({});

	return {
		createAccount: async (data: RegisterInput) => {
			setLocalErrorMessage(null);
			setLocalValidationErrors({});
			try {
				const result = await mutation.mutateAsync(data);
				if (!result.success) {
					const validationErrors = extractValidationErrors(result);
					setLocalValidationErrors(validationErrors);
					const errMessage =
						(result as unknown as { errorMessage?: string }).errorMessage ??
						result.error ??
						"Registration failed";
					setLocalErrorMessage(errMessage);
					throw new Error(errMessage);
				}
				return result;
			} catch (e) {
				const info = normalizeError(e);
				if (info.errors) setLocalValidationErrors(info.errors);
				const msg =
					info.errorMessage ?? (e instanceof Error ? e.message : String(e));
				setLocalErrorMessage(msg);
				throw new Error(msg);
			}
		},
		isPending: mutation.isPending,
		isError: mutation.isError || Boolean(localErrorMessage),
		errorMessage:
			localErrorMessage ??
			(mutation.data && !(mutation.data as { success?: boolean }).success
				? (mutation.data as unknown as { errorMessage?: string }).errorMessage
				: undefined),
		validationErrors:
			(mutation.data && !(mutation.data as { success?: boolean }).success
				? extractValidationErrors(mutation.data)
				: localValidationErrors) || {},
		reset: () => {
			mutation.reset();
			setLocalErrorMessage(null);
			setLocalValidationErrors({});
		},
	};
}
