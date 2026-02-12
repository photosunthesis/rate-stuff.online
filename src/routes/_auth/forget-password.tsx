import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import authClient from "~/domains/users/auth/client";
import { AuthLayout } from "~/domains/users/components/auth-layout";
import { ForgotPasswordForm } from "~/domains/users/components/forget-password-form";
import { forgotPasswordSchema } from "~/domains/users/types";
import { withTimeout } from "~/utils/timeout";
import { useUmami } from "@danielgtmn/umami-react";

export const Route = createFileRoute("/_auth/forget-password")({
	component: RouteComponent,
	head: () => {
		return {
			meta: [
				{
					title: "Forgot Password - Rate Stuff Online",
				},
				{
					name: "description",
					content: "Reset your Rate Stuff Online password.",
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
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});

	const { mutateAsync: forgotPasswordMutate, isPending } = useMutation({
		mutationFn: async (email: string) => {
			setErrorMessage(null);
			setValidationErrors({});

			// Client-side validation
			const result = forgotPasswordSchema.safeParse({ email });
			if (!result.success) {
				const errors: Record<string, string> = {};
				for (const issue of result.error.issues) {
					errors[issue.path[0] as string] = issue.message;
				}
				setValidationErrors(errors);
				throw new Error("Validation failed");
			}

			const { error } = await withTimeout(
				authClient.requestPasswordReset({
					email,
					redirectTo: "/reset-password",
				}),
			);

			if (error) {
				setErrorMessage(
					error.message ??
						`Failed to send reset link due to an error: ${error}`,
				);
				throw new Error(
					error.message ??
						`Failed to send reset link due to an error: ${error}`,
				);
			}

			if (umami) {
				umami.track("forgot_password");
			}
		},
	});

	const handleSubmit = async (data: { email: string }) => {
		if (isPending) return;
		await forgotPasswordMutate(data.email);
	};

	return (
		<AuthLayout
			title="Forgot password?"
			description="No worries, we'll send you reset instructions."
			footerText="Remember your password?"
			footerLinkText="Sign in"
			footerLinkTo="/sign-in"
		>
			<ForgotPasswordForm
				onSubmit={handleSubmit}
				isPending={isPending}
				errorMessage={errorMessage}
				validationErrors={validationErrors}
			/>
		</AuthLayout>
	);
}
