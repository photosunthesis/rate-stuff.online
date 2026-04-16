import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { TextField } from "~/shared/components/ui/text-field";
import { Button } from "~/shared/components/ui/button";
import { Checkbox } from "~/shared/components/ui/checkbox";
import { FormError } from "~/shared/components/ui/form-error";
import { registerSchema } from "../types";
import { m } from "~/paraglide/messages";

interface SignUpFormProps {
	onSubmit: (data: {
		username: string;
		email: string;
		password: string;
		confirmPassword: string;
		terms: boolean;
	}) => Promise<void>;
	isPending: boolean;
	errorMessage?: string | null;
	validationErrors: Record<string, string>;
}

export function SignUpForm({
	onSubmit,
	isPending,
	errorMessage,
	validationErrors,
}: SignUpFormProps) {
	const [isSuccess, setIsSuccess] = useState(false);
	const form = useForm({
		defaultValues: {
			username: "",
			email: "",
			password: "",
			confirmPassword: "",
			terms: false,
		},
		onSubmit: async ({ value }) => {
			setIsSuccess(false);
			try {
				await onSubmit(value);
				setIsSuccess(true);
			} catch {
				// Error handled by parent
			}
		},
	});

	const inferredFieldErrors: Record<string, string> = {};

	if (errorMessage) {
		const msg = errorMessage.toLowerCase();
		if (msg.includes("email") && !validationErrors.email)
			inferredFieldErrors.email = errorMessage;

		if (msg.includes("username") && !validationErrors.username)
			inferredFieldErrors.username = errorMessage;

		if (msg.includes("confirm") && !validationErrors.confirmPassword)
			inferredFieldErrors.confirmPassword = errorMessage;

		if (
			msg.includes("password") &&
			!validationErrors.password &&
			!inferredFieldErrors.confirmPassword
		)
			inferredFieldErrors.password = errorMessage;
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
						name="username"
						validators={{
							onChange: ({ value }) => {
								const result = registerSchema.shape.username.safeParse(value);
								return result.success
									? undefined
									: result.error.issues[0].message;
							},
						}}
					>
						{(field) => (
							<TextField
								label={m.sign_up_username_label()}
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder={m.sign_up_username_placeholder()}
								error={
									field.state.meta.errors[0]?.toString() ||
									mergedValidationErrors.username
								}
								required
							/>
						)}
					</form.Field>

					<form.Field
						name="email"
						validators={{
							onChange: ({ value }) => {
								const result = registerSchema.shape.email.safeParse(value);
								return result.success
									? undefined
									: result.error.issues[0].message;
							},
						}}
					>
						{(field) => (
							<TextField
								label="Email"
								type="email"
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder={m.sign_up_email_placeholder()}
								error={
									field.state.meta.errors[0]?.toString() ||
									mergedValidationErrors.email
								}
								required
							/>
						)}
					</form.Field>

					<form.Field
						name="password"
						validators={{
							onChange: ({ value }) => {
								const result = registerSchema.shape.password.safeParse(value);
								return result.success
									? undefined
									: result.error.issues[0].message;
							},
						}}
					>
						{(field) => (
							<TextField
								label="Password"
								type="password"
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder={m.sign_up_password_placeholder()}
								error={
									field.state.meta.errors[0]?.toString() ||
									mergedValidationErrors.password
								}
								required
							/>
						)}
					</form.Field>

					<form.Field
						name="confirmPassword"
						validators={{
							onChange: ({ value, fieldApi }) => {
								if (value !== fieldApi.form.getFieldValue("password")) {
									return m.passwords_do_not_match();
								}
								return undefined;
							},
						}}
					>
						{(field) => (
							<TextField
								label={m.sign_up_confirm_label()}
								type="password"
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder={m.sign_up_confirm_placeholder()}
								error={
									field.state.meta.errors[0]?.toString() ||
									mergedValidationErrors.confirmPassword
								}
								required
							/>
						)}
					</form.Field>

					<form.Field
						name="terms"
						validators={{
							onChange: ({ value }) => {
								const result = registerSchema.shape.terms.safeParse(value);
								return result.success
									? undefined
									: result.error.issues[0].message;
							},
						}}
					>
						{(field) => (
							<Checkbox
								id={field.name}
								name={field.name}
								checked={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.checked)}
								error={
									field.state.meta.errors[0]?.toString() ||
									mergedValidationErrors.terms
								}
								label={
									<span className="text-neutral-400">
										{m.sign_up_agree_prefix()}{" "}
										<a
											href="/terms"
											className="underline underline-offset-2 hover:text-neutral-200"
											target="_blank"
											rel="noopener noreferrer"
										>
											{m.terms_of_service()}
										</a>{" "}
										{m.sign_up_agree_and()}{" "}
										<a
											href="/privacy"
											className="underline underline-offset-2 hover:text-neutral-200"
											target="_blank"
											rel="noopener noreferrer"
										>
											{m.privacy_policy()}
										</a>
										.
									</span>
								}
							/>
						)}
					</form.Field>
				</fieldset>

				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting]}
				>
					{([canSubmit, isSubmitting]) => (
						<Button
							type="submit"
							loadingLabel={m.sign_up_loading()}
							disabled={!canSubmit || isPending || isSubmitting || isSuccess}
							isLoading={isPending || isSubmitting || isSuccess}
							className="mt-6"
						>
							{isSuccess ? m.sign_up_success() : m.sign_up_button()}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</>
	);
}
