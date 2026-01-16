import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { TextField } from "~/components/ui/text-field";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { FormError } from "~/components/ui/form-error";
import { loginSchema } from "../types";

interface SignInFormProps {
	onSubmit: (data: {
		identifier: string;
		password: string;
		rememberMe: boolean;
	}) => Promise<void>;
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
			rememberMe: false,
		},
		onSubmit: async ({ value }) =>
			await onSubmit(value).then(() => setIsSuccess(true)),
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
					<form.Field name="rememberMe">
						{(field) => (
							<Checkbox
								label="Remember me"
								name={field.name}
								checked={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.checked)}
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
							disabled={!canSubmit || isPending || isSubmitting || isSuccess}
							isLoading={isPending || isSubmitting || isSuccess}
							className="mt-6"
							loadingLabel="Signing in..."
						>
							{isSuccess ? "Signed In" : "Sign In"}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</>
	);
}
