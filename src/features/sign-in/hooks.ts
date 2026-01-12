import { useLoginMutation } from "~/features/sign-in/queries";
import type { LoginInput } from "~/features/sign-in/types";
import { useState } from "react";

function extractValidationErrors(payload: unknown): Record<string, string> {
	if (!payload || typeof payload !== "object" || Array.isArray(payload))
		return {};
	const obj = payload as Record<string, unknown>;
	const candidate = obj.errors ?? obj.error ?? undefined;
	if (!candidate || typeof candidate !== "object" || Array.isArray(candidate))
		return {};
	const c = candidate as Record<string, unknown>;
	const isStringMap = Object.values(c).every((v) => typeof v === "string");
	return isStringMap ? (c as Record<string, string>) : {};
}

function normalizeError(err: unknown): {
	errorMessage?: string;
	errors?: Record<string, string>;
} {
	if (!err) return {};
	if (err instanceof Error) {
		const msg = err.message ?? "";
		try {
			const parsed = JSON.parse(msg);
			return normalizeError(parsed);
		} catch {
			return { errorMessage: msg };
		}
	}
	if (typeof err === "string") {
		try {
			const parsed = JSON.parse(err);
			return normalizeError(parsed);
		} catch {
			return { errorMessage: err };
		}
	}
	if (typeof err === "object" && err !== null && !Array.isArray(err)) {
		const o = err as Record<string, unknown>;
		const message =
			typeof o.errorMessage === "string"
				? o.errorMessage
				: typeof o.error === "string"
					? o.error
					: typeof o.message === "string"
						? o.message
						: undefined;
		const errors = extractValidationErrors(o);
		return {
			errorMessage: message,
			errors: Object.keys(errors).length ? errors : undefined,
		};
	}
	return { errorMessage: String(err) };
}

export function useSignIn() {
	const mutation = useLoginMutation();
	const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(
		null,
	);
	const [localValidationErrors, setLocalValidationErrors] = useState<
		Record<string, string>
	>({});

	return {
		signIn: async (data: LoginInput) => {
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
						"Login failed";
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
