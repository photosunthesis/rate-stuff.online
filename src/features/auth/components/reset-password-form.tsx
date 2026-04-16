import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { Button } from "~/shared/components/ui/button";
import { FormError } from "~/shared/components/ui/form-error";
import { TextField } from "~/shared/components/ui/text-field";
import { resetPasswordSchema } from "../types";
import { m } from "~/paraglide/messages";

interface ResetPasswordFormProps {
	onSubmit: (data: { password: string }) => Promise<void>;
	isPending: boolean;
	errorMessage?: string | null;
	validationErrors: Record<string, string>;
}

export function ResetPasswordForm({
	onSubmit,
	isPending,
	errorMessage,
	validationErrors,
}: ResetPasswordFormProps) {
	const [isSuccess, setIsSuccess] = useState(false);
	const form = useForm({
		defaultValues: {
			password: "",
			confirmPassword: "",
		},
		onSubmit: async ({ value }) => {
			setIsSuccess(false);
			try {
				await onSubmit({ password: value.password });
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
							{m.reset_password_success_title()}
						</h3>
						<p className="text-neutral-400 text-base">
							{m.reset_password_success_description()}
						</p>
					</div>
					<Button
						className="mt-4 w-full"
						onClick={() => {
							window.location.href = "/sign-in";
						}}
					>
						{m.reset_password_sign_in()}
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
							name="password"
							validators={{
								onChange: ({ value }) => {
									const result =
										resetPasswordSchema.shape.password.safeParse(value);
									return result.success
										? undefined
										: result.error.issues[0].message;
								},
							}}
						>
							{(field) => (
								<TextField
									label={m.reset_password_new_label()}
									type="password"
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder={m.reset_password_new_placeholder()}
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
									label={m.reset_password_confirm_label()}
									type="password"
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder={m.reset_password_confirm_placeholder()}
									error={
										field.state.meta.errors[0]?.toString() ||
										mergedValidationErrors.confirmPassword
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
								loadingLabel={m.reset_password_loading()}
							>
								{m.reset_password_button()}
							</Button>
						)}
					</form.Subscribe>
				</form>
			)}
		</>
	);
}
