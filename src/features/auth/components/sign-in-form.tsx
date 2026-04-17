import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { TextField } from "~/shared/components/ui/text-field";
import { Button } from "~/shared/components/ui/button";
import { FormError } from "~/shared/components/ui/form-error";
import { loginSchema } from "../types";
import { m } from "~/paraglide/messages";

interface SignInFormProps {
	onSubmit: (data: { identifier: string; password: string }) => Promise<void>;
	isPending: boolean;
	errorMessage?: string | null;
	validationErrors: Record<string, string>;
}

export function SignInForm({
	onSubmit,
	isPending,
	errorMessage,
	validationErrors,
}: SignInFormProps) {
	const [isSuccess, setIsSuccess] = useState(false);
	const form = useForm({
		defaultValues: {
			identifier: "",
			password: "",
			rememberMe: true,
		},
		onSubmit: async ({ value }) => {
			setIsSuccess(false);
			try {
				await onSubmit(value);
				setIsSuccess(true);
			} catch {
				// Error is handled by parent component
			}
		},
	});

	const inferredFieldErrors: Record<string, string> = {};
	if (errorMessage) {
		const msg = errorMessage.toLowerCase();
		if (
			(msg.includes("email") || msg.includes("username")) &&
			!validationErrors.identifier
		)
			inferredFieldErrors.identifier = errorMessage;

		if (msg.includes("password") && !validationErrors.password)
			inferredFieldErrors.password = errorMessage;

		if (msg.includes("invalid credentials") || msg.includes("invalid")) {
			inferredFieldErrors.identifier = errorMessage;
			inferredFieldErrors.password = errorMessage;
		}
	}

	const mergedValidationErrors = {
		...validationErrors,
		...inferredFieldErrors,
	};

	const hasGlobalError =
		Boolean(errorMessage) && Object.keys(mergedValidationErrors).length === 0;

	return (
		<>
			{hasGlobalError && <FormError message={errorMessage ?? ""} />}

			<form
				method="post"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4"
				noValidate
			>
				<fieldset
					disabled={isPending || isSuccess}
					className="space-y-4 border-none p-0 m-0"
				>
					<form.Field
						name="identifier"
						validators={{
							onChange: ({ value }) => {
								const result = loginSchema.shape.identifier.safeParse(value);
								return result.success
									? undefined
									: result.error.issues[0].message;
							},
						}}
					>
						{(field) => (
							<TextField
								label={m.sign_in_identifier_label()}
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder={m.sign_in_identifier_placeholder()}
								error={
									field.state.meta.errors[0]?.toString() ||
									mergedValidationErrors.identifier
								}
								required
							/>
						)}
					</form.Field>

					<form.Field
						name="password"
						validators={{
							onChange: ({ value }) => {
								const result = loginSchema.shape.password.safeParse(value);
								return result.success
									? undefined
									: result.error.issues[0].message;
							},
						}}
					>
						{(field) => (
							<div>
								<TextField
									label="Password"
									type="password"
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder={m.sign_in_password_placeholder()}
									error={
										field.state.meta.errors[0]?.toString() ||
										mergedValidationErrors.password
									}
									required
								/>
								<div className="flex mt-2">
									<a
										href="/forget-password"
										className="text-xs text-neutral-300 hover:text-white transition-colors"
									>
										{m.sign_in_forgot_password()}
									</a>
								</div>
							</div>
						)}
					</form.Field>
				</fieldset>

				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting]}
				>
					{([canSubmit, isSubmitting]) => (
						<Button
							type="submit"
							disabled={!canSubmit || isPending || isSubmitting || isSuccess}
							isLoading={isPending || isSubmitting || isSuccess}
							className="mt-6"
							loadingLabel={m.sign_in_loading()}
						>
							{isSuccess ? m.sign_in_success() : m.sign_in_button()}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</>
	);
}
