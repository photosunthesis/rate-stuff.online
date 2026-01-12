import type { RegisterInput } from "~/features/create-account/types";
import { useState } from "react";
import { extractValidationErrors, normalizeError } from "~/utils/errors";
import { useQueryClient } from "@tanstack/react-query";
import { authQueryOptions } from "~/lib/auth/queries";
import { useNavigate } from "@tanstack/react-router";
import { useCreateAccountMutation } from "./queries";

export function useCreateAccount() {
	const useCreateAccount = useCreateAccountMutation();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
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
				const result = await useCreateAccount.mutateAsync(data);

				if (result.error) {
					const validationErrors = extractValidationErrors(result);
					setLocalValidationErrors(validationErrors);
					const errMessage = result.error.message ?? "Account creation failed";
					setLocalErrorMessage(errMessage);
					throw new Error(errMessage);
				}

				// Invalidate auth queries to refresh auth state
				queryClient.removeQueries({ queryKey: authQueryOptions().queryKey });

				navigate({ to: "/set-up-profile" });
			} catch (e) {
				const info = normalizeError(e);

				if (info.errors) setLocalValidationErrors(info.errors);

				const msg =
					info.errorMessage ?? (e instanceof Error ? e.message : String(e));

				setLocalErrorMessage(msg);
			}
		},
		isPending: useCreateAccount.isPending,
		isError: useCreateAccount.isError || Boolean(localErrorMessage),
		errorMessage:
			localErrorMessage ??
			(useCreateAccount.data &&
			!(useCreateAccount.data as { success?: boolean }).success
				? (useCreateAccount.data as unknown as { errorMessage?: string })
						.errorMessage
				: undefined),
		validationErrors:
			(useCreateAccount.data &&
			!(useCreateAccount.data as { success?: boolean }).success
				? extractValidationErrors(useCreateAccount.data)
				: localValidationErrors) || {},
	};
}
