import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout } from "~/lib/auth/components/auth-layout";
import { SignUpForm } from "~/lib/auth/components/sign-up-form";
import { authQueryOptions, useSignUpMutation } from "~/lib/auth/queries";
import type { RegisterInput } from "~/lib/auth/types";
import { extractValidationErrors, normalizeError } from "~/utils/errors";

export const Route = createFileRoute("/_auth/sign-up")({
	component: RouteComponent,
	head: () => {
		return {
			meta: [
				{
					title: "Create Account - Rate Stuff Online",
				},
				{
					name: "description",
					content:
						"Create a new account on Rate Stuff Online. Join our community and start rating stuff today.",
				},
				{
					name: "og:title",
					property: "og:title",
					content: "Create Account - Rate Stuff Online",
				},
				{
					name: "og:description",
					property: "og:description",
					content: "Join Rate Stuff Online and start rating",
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
	const signUp = useSignUpMutation();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [validationErrors, setValidationErrors] = useState({});

	const handleSubmit = async (data: RegisterInput) => {
		setErrorMessage(null);
		setValidationErrors({});

		try {
			const result = await signUp.mutateAsync(data);
			if (!result.success) {
				const errors = extractValidationErrors(result);
				setValidationErrors(errors);
				const msg =
					(result as unknown as { errorMessage?: string }).errorMessage ??
					"Failed to create account";
				setErrorMessage(msg);
				throw new Error(msg);
			}

			queryClient.removeQueries({ queryKey: authQueryOptions().queryKey });

			navigate({ to: "/set-up-profile" });
		} catch (e) {
			const info = normalizeError(e);
			if (info.errors) setValidationErrors(info.errors);
			const msg =
				info.errorMessage ?? (e instanceof Error ? e.message : String(e));
			setErrorMessage(msg);
			throw new Error(msg);
		}
	};

	return (
		<AuthLayout
			title="Join the community"
			description="Your account. Your ratings. One to ten. Start here."
			footerText="Already have an account?"
			footerLinkText="Sign in"
			footerLinkTo="/sign-in"
		>
			<SignUpForm
				onSubmit={handleSubmit}
				isPending={signUp.isPending}
				errorMessage={
					errorMessage ??
					(signUp.data && !(signUp.data as { success?: boolean }).success
						? (signUp.data as unknown as { errorMessage?: string }).errorMessage
						: undefined)
				}
				validationErrors={
					(signUp.data && !(signUp.data as { success?: boolean }).success
						? extractValidationErrors(signUp.data)
						: validationErrors) || {}
				}
			/>
		</AuthLayout>
	);
}
