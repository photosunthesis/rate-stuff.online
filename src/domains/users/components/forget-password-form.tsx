import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { Button } from "~/components/ui/form/button";
import { FormError } from "~/components/ui/form/form-error";
import { TextField } from "~/components/ui/form/text-field";
import { forgotPasswordSchema } from "../types";

interface ForgotPasswordFormProps {
	onSubmit: (data: { email: string }) => Promise<void>;
	isPending: boolean;
	errorMessage?: string | null;
	validationErrors: Record<string, string>;
}

export function ForgotPasswordForm({
	onSubmit,
	isPending,
	errorMessage,
	validationErrors,
}: ForgotPasswordFormProps) {
	const [isSuccess, setIsSuccess] = useState(false);
	const form = useForm({
		defaultValues: {
			email: "",
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

	const mergedValidationErrors = {
		...validationErrors,
	};

	return (
		<>
			{errorMessage && <FormError message={errorMessage} />}
			{isSuccess ? (
				<div className="text-center space-y-4">
					<div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
						<h3 className="text-lg font-medium text-white mb-2">
							Check your email
						</h3>
						<p className="text-neutral-400 text-base">
							We've sent a password reset link to your email address. Please
							check your inbox (and spam folder) to continue.
						</p>
					</div>
					<Button
						variant="secondary"
						className="mt-4 w-full"
						onClick={() => setIsSuccess(false)}
					>
						Try another email
					</Button>
				</div>
			) : (
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
							name="email"
							validators={{
								onChange: ({ value }) => {
									const result =
										forgotPasswordSchema.shape.email.safeParse(value);
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
									placeholder="you@example.com"
									error={
										field.state.meta.errors[0]?.toString() ||
										mergedValidationErrors.email
									}
									required
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
								disabled={!canSubmit || isPending || isSubmitting}
								isLoading={isPending || isSubmitting}
								className="mt-6"
								loadingLabel="Sending Link..."
							>
								Send Reset Link
							</Button>
						)}
					</form.Subscribe>
				</form>
			)}
		</>
	);
}
