import { useMutation } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import authClient from "~/auth/auth.client";
import { NotFound } from "~/components/ui/not-found";
import { AuthLayout } from "~/features/auth/components/auth-layout";
import { ResetPasswordForm } from "~/features/auth/components/reset-password-form";
import { resetPasswordSchema } from "~/features/auth/types";
import { withTimeout } from "~/utils/timeout";

export const Route = createFileRoute("/_auth/reset-password")({
	component: RouteComponent,
	notFoundComponent: NotFound,
	beforeLoad: ({ search }) => {
		const { token } = search as { token?: string };
		if (!token) throw notFound();
	},
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
	const { token } = Route.useSearch() as { token?: string };
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});

	const { mutateAsync: resetPasswordMutate, isPending } = useMutation({
		mutationFn: async (password: string) => {
			setErrorMessage(null);
			setValidationErrors({});

			const passwordSchema = resetPasswordSchema.shape.password;
			const result = passwordSchema.safeParse(password);

			if (!result.success) {
				setValidationErrors({ password: result.error.issues[0].message });
				throw new Error("Validation failed");
			}

			if (!token) {
				setErrorMessage("Invalid or missing reset token.");
				throw new Error("Invalid or missing reset token.");
			}

			const { error } = await withTimeout(
				authClient.resetPassword({
					newPassword: password,
					token,
				}),
			);

			if (error) {
				setErrorMessage(
					error.message ?? `Failed to reset password due to an error: ${error}`,
				);
				throw new Error(
					error.message ?? `Failed to reset password due to an error: ${error}`,
				);
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
