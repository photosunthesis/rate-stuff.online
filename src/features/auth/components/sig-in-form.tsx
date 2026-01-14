import { useForm } from "@tanstack/react-form";
import { TextField } from "~/components/ui/text-field";
import { Button } from "~/components/ui/button";
import { FormError } from "~/components/ui/form-error";
import { loginSchema } from "../types";

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
	const form = useForm({
		defaultValues: {
			identifier: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await onSubmit(value);
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

		if (msg.includes("invalid credentials")) {
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
							label="Email or Username"
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="you@example.com or your-username"
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
						<TextField
							label="Password"
							type="password"
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="Your password"
							error={
								field.state.meta.errors[0]?.toString() ||
								mergedValidationErrors.password
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
							disabled={!canSubmit || isPending || isSubmitting}
							isLoading={isPending || isSubmitting}
							className="mt-6"
							loadingLabel="Signing in..."
						>
							Sign In
						</Button>
					)}
				</form.Subscribe>
			</form>
		</>
	);
}
