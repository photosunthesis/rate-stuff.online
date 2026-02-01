import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { TextField } from "~/components/ui/form/text-field";
import { Button } from "~/components/ui/form/button";
import { Checkbox } from "~/components/ui/form/checkbox";
import { FormError } from "~/components/ui/form/form-error";
import { registerSchema } from "../types";

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
								label="Username"
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="coolusername123"
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
								placeholder="your@email.com"
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
								placeholder="Secret password"
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
									return "Passwords do not match";
								}
								return undefined;
							},
						}}
					>
						{(field) => (
							<TextField
								label="Confirm Password"
								type="password"
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Confirm password"
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
										I am 13 years or older and agree to the{" "}
										<a
											href="/terms"
											className="underline underline-offset-2 hover:text-neutral-200"
											target="_blank"
											rel="noopener noreferrer"
										>
											Terms of Service
										</a>{" "}
										and{" "}
										<a
											href="/privacy"
											className="underline underline-offset-2 hover:text-neutral-200"
											target="_blank"
											rel="noopener noreferrer"
										>
											Privacy Policy
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
							loadingLabel="Creating Account..."
							disabled={!canSubmit || isPending || isSubmitting || isSuccess}
							isLoading={isPending || isSubmitting || isSuccess}
							className="mt-6"
						>
							{isSuccess ? "Welcome!" : "Create Account"}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</>
	);
}
