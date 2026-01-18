import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import authClient from "~/auth/auth.client";
import { AuthLayout } from "~/features/auth/components/auth-layout";
import { ResetPasswordForm } from "~/features/auth/components/reset-password-form";
import { resetPasswordSchema } from "~/features/auth/types";
import { normalizeError } from "~/utils/errors";

export const Route = createFileRoute("/_auth/reset-password")({
	component: RouteComponent,
	head: () => {
		return {
			meta: [
				{
					title: "Reset Password - Rate Stuff Online",
				},
				{
					name: "description",
					content: "Set a new password for your account.",
				},
				{
					name: "robots",
					content: "noindex, follow",
				},
			],
		};
	},
});

function RouteComponent() {
	const { token } = Route.useSearch() as { token: string };
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});

	if (!token) {
		// Ideally we should redirect or show an error state if no token
		// But for now let's just render the layout with an error
		// Or we can let the authClient handle the error when we try to submit
	}

	const { mutateAsync: resetPasswordMutate, isPending } = useMutation({
		mutationFn: async (password: string) => {
			setErrorMessage(null);
			setValidationErrors({});

			// We do not need to check for confirmPassword here because it is checked in the form logic
			// and the schema validation below only checks password strength if we used the partial schema
			// but we can re-use the full schema if we mock confirmPassword

			// Let's just validate the password strength
			const passwordSchema = resetPasswordSchema.shape.password;
			const result = passwordSchema.safeParse(password);

			if (!result.success) {
				setValidationErrors({ password: result.error.issues[0].message });
				return;
			}

			if (!token) {
				setErrorMessage("Invalid or missing reset token.");
				return;
			}

			const { error } = await authClient.resetPassword({
				newPassword: password,
				token,
			});

			if (error) throw error;
		},
		onError: (err: unknown) => {
			const info = normalizeError(err);
			if (info.errors) {
				setValidationErrors(info.errors);
			} else {
				setErrorMessage(info.errorMessage ?? "Failed to reset password");
			}
		},
	});

	const handleSubmit = async (data: { password: string }) => {
		if (isPending) return;
		await resetPasswordMutate(data.password);
	};

	return (
		<AuthLayout
			title="Reset Password"
			description="Enter your new password below."
			footerText="Remember your password?"
			footerLinkText="Sign in"
			footerLinkTo="/sign-in"
		>
			{!token ? (
				<div className="text-red-500 text-center py-4">
					Invalid or missing reset token. Please request a new password reset
					link.
				</div>
			) : (
				<ResetPasswordForm
					onSubmit={handleSubmit}
					isPending={isPending}
					errorMessage={errorMessage}
					validationErrors={validationErrors}
				/>
			)}
		</AuthLayout>
	);
}
