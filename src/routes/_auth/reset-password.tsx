import { useMutation } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import authClient from "~/features/auth/client";
import { NotFound } from "~/shared/components/feedback/not-found";
import { AuthLayout } from "~/features/auth/components/auth-layout";
import { ResetPasswordForm } from "~/features/auth/components/reset-password-form";
import { resetPasswordSchema } from "~/features/auth/types";
import { withTimeout } from "~/infrastructure/http/timeout";
import { useUmami } from "@danielgtmn/umami-react";
import { m } from "~/paraglide/messages";

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
	const umami = useUmami();
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
				setErrorMessage(m.reset_password_invalid_token());
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

			if (umami) {
				umami.track("reset_password");
			}
		},
	});

	const handleSubmit = async (data: { password: string }) => {
		if (isPending) return;
		await resetPasswordMutate(data.password);
	};

	return (
		<AuthLayout
			title={m.reset_password_page_title()}
			description={m.reset_password_page_description()}
			footerText={m.reset_password_page_footer_text()}
			footerLinkText={m.sign_in_page_footer_link()}
			footerLinkTo="/sign-in"
		>
			{!token ? (
				<div className="text-red-500 text-center py-4">
					{m.reset_password_invalid_token_description()}
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
