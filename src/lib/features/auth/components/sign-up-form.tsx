import { useForm } from "@tanstack/react-form";
import { TextField } from "~/components/ui/text-field";
import { Button } from "~/components/ui/button";
import { FormError } from "~/components/ui/form-error";
import { registerSchema } from "../types";

interface SignUpFormProps {
	onSubmit: (data: {
		username: string;
		email: string;
		password: string;
		confirmPassword: string;
		inviteCode: string;
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
	const form = useForm({
		defaultValues: {
			username: "",
			email: "",
			password: "",
			confirmPassword: "",
			inviteCode: "",
		},
		onSubmit: async ({ value }) => {
			await onSubmit(value);
		},
	});

	const inferredFieldErrors: Record<string, string> = {};

	if (errorMessage) {
		const msg = errorMessage.toLowerCase();
		if (msg.includes("email") && !validationErrors.email)
			inferredFieldErrors.email = errorMessage;

		if (msg.includes("username") && !validationErrors.username)
			inferredFieldErrors.username = errorMessage;

		if (
			(msg.includes("invite") || msg.includes("invite code")) &&
			!validationErrors.inviteCode
		)
			inferredFieldErrors.inviteCode = errorMessage;

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
				<form.Field
					name="inviteCode"
					validators={{
						onChange: ({ value }) => {
							const result = registerSchema.shape.inviteCode.safeParse(value);
							return result.success
								? undefined
								: result.error.issues[0].message;
						},
					}}
				>
					{(field) => (
						<div>
							<TextField
								label="Invite Code"
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="e.g., NUS420"
								error={
									field.state.meta.errors[0]?.toString() ||
									mergedValidationErrors.inviteCode
								}
								required
							/>
							<p className="text-neutral-500 text-xs mt-2">
								We're invite-only for now while we build things out. Thank you
								for your interest!
							</p>
						</div>
					)}
				</form.Field>

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

				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting]}
				>
					{([canSubmit, isSubmitting]) => (
						<Button
							type="submit"
							loadingLabel="Creating Account..."
							disabled={!canSubmit || isPending || isSubmitting}
							isLoading={isPending || isSubmitting}
							className="mt-6"
						>
							Create Account
						</Button>
					)}
				</form.Subscribe>
			</form>
		</>
	);
}
