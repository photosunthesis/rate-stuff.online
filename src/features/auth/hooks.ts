import { useState, useEffect } from "react";
import { useRegisterMutation, useLoginMutation } from "./queries";
import type { RegisterInput, LoginInput, ValidationErrors } from "./types";

export interface UseRegisterReturn {
	register: (data: RegisterInput) => Promise<void>;
	isPending: boolean;
	isError: boolean;
	errorMessage: string | null;
	validationErrors: ValidationErrors;
	reset: () => void;
}

export function useRegister(): UseRegisterReturn {
	const mutation = useRegisterMutation();
	const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
		{},
	);

	// If the mutation.error contains a JSON-stringified Zod issues array, parse it
	useEffect(() => {
		const err = mutation.error;
		if (err instanceof Error) {
			const msg = err.message?.trim();
			if (msg && (msg.startsWith("[") || msg.startsWith("{"))) {
				try {
					const parsed = JSON.parse(msg);
					if (Array.isArray(parsed)) {
						const map: ValidationErrors = {};
						for (const issue of parsed) {
							const key =
								issue.path && issue.path.length
									? String(issue.path[0])
									: "form";
							if (!map[key]) map[key] = issue.message;
						}
						setValidationErrors(map);
					}
				} catch {
					// ignore parse errors
				}
			}
		}
	}, [mutation.error]);

	const register = async (data: RegisterInput) => {
		setValidationErrors({});
		let result;
		try {
			result = await mutation.mutateAsync(data);
		} catch (error) {
			// mutateAsync should return AuthResponse; in case of unexpected throw, set a generic error
			setValidationErrors({});
			return;
		}

		if (!result?.success) {
			if (result.errors && Object.keys(result.errors).length > 0) {
				setValidationErrors(result.errors as ValidationErrors);
			}
		}
	};

	return {
		register,
		isPending: mutation.isPending,
		isError:
			mutation.isError ||
			(!!mutation.error && Object.keys(validationErrors).length === 0),
		errorMessage:
			mutation.error instanceof Error ? mutation.error.message : null,
		validationErrors,
		reset: mutation.reset,
	};
}

export interface UseLoginReturn {
	login: (data: LoginInput) => Promise<void>;
	isPending: boolean;
	isError: boolean;
	errorMessage: string | null;
	validationErrors: ValidationErrors;
	reset: () => void;
}

export function useLogin(): UseLoginReturn {
	const mutation = useLoginMutation();
	const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
		{},
	);

	useEffect(() => {
		const err = mutation.error;
		if (err instanceof Error) {
			const msg = err.message?.trim();
			if (msg && (msg.startsWith("[") || msg.startsWith("{"))) {
				try {
					const parsed = JSON.parse(msg);
					if (Array.isArray(parsed)) {
						const map: ValidationErrors = {};
						for (const issue of parsed) {
							const key =
								issue.path && issue.path.length
									? String(issue.path[0])
									: "form";
							if (!map[key]) map[key] = issue.message;
						}
						setValidationErrors(map);
					}
				} catch {
					// ignore parse errors
				}
			}
		}
	}, [mutation.error]);

	const login = async (data: LoginInput) => {
		setValidationErrors({});
		let result;
		try {
			result = await mutation.mutateAsync(data);
		} catch (error) {
			setValidationErrors({});
			return;
		}

		if (!result?.success) {
			if (result.errors && Object.keys(result.errors).length > 0) {
				setValidationErrors(result.errors as ValidationErrors);
			}
		}
	};

	return {
		login,
		isPending: mutation.isPending,
		isError:
			mutation.isError ||
			(!!mutation.error && Object.keys(validationErrors).length === 0),
		errorMessage:
			mutation.error instanceof Error ? mutation.error.message : null,
		validationErrors,
		reset: mutation.reset,
	};
}
