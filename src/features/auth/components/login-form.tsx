import { useForm } from "@tanstack/react-form";
import { TextField } from "~/components/ui/text-field";
import { Button } from "~/components/ui/button";
import { FormError } from "~/components/ui/form-error";
import { loginSchema, type LoginInput } from "../types";

interface LoginFormProps {
	onSubmit: (data: LoginInput) => Promise<void>;
	isPending: boolean;
	error?: Error | null;
	validationErrors: Record<string, string>;
}

export function LoginForm({
	onSubmit,
	isPending,
	error,
	validationErrors,
}: LoginFormProps) {
	const form = useForm({
		defaultValues: {
			identifier: "",
			password: "",
		} as LoginInput,
		onSubmit: async ({ value }) => {
			await onSubmit(value);
		},
	});

	const hasGlobalError = error && Object.keys(validationErrors).length === 0;

	return (
		<>
			{hasGlobalError && <FormError message={error.message} />}

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
								validationErrors.identifier
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
								validationErrors.password
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
						>
							Sign In
						</Button>
					)}
				</form.Subscribe>
			</form>
		</>
	);
}
