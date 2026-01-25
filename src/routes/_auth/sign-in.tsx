import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import authClient from "~/domains/users/auth/client";
import { withTimeout } from "~/utils/timeout";
import { AuthLayout } from "~/domains/users/components/auth-layout";
import { SignInForm } from "~/domains/users/components/sign-in-form";
import { authQueryOptions } from "~/domains/users/queries";
import { isEmail } from "~/utils/strings";

export const Route = createFileRoute("/_auth/sign-in")({
	component: RouteComponent,
	head: () => {
		return {
			meta: [
				{
					title: "Sign In - Rate Stuff Online",
				},
				{
					name: "description",
					content: "Sign in to your Rate Stuff Online account.",
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
	const redirectUrl = Route.useRouteContext().redirectUrl;
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [validationErrors, setValidationErrors] = useState(
		{} as Record<string, string>,
	);

	const handleSuccess = (redirect?: string) => {
		queryClient.removeQueries({ queryKey: authQueryOptions().queryKey });
		navigate({ to: redirect ?? "/" });
	};

	const { mutateAsync: signInMutate, isPending } = useMutation({
		mutationFn: async (data: {
			identifier: string;
			password: string;
			redirectUrl?: string;
		}) => {
			if (isEmail(data.identifier)) {
				const payload = {
					email: data.identifier,
					password: data.password,
					callbackURL: data.redirectUrl,
					rememberMe: true,
				};

				const { error } = await withTimeout(authClient.signIn.email(payload), {
					context: "sign-in-email",
				});

				if (error) {
					console.error(error);
					setErrorMessage(
						error.message ?? `Failed to sign in due to an error: ${error}`,
					);
					throw error;
				}

				handleSuccess(data.redirectUrl);
			} else {
				const payload = {
					username: data.identifier,
					password: data.password,
					rememberMe: true,
				};

				const { error } = await withTimeout(
					authClient.signIn.username(payload),
					{ context: "sign-in-username" },
				);

				if (error) {
					console.error(error);
					setErrorMessage(
						error.message ?? `Failed to sign in due to an error: ${error}`,
					);
					throw error;
				}

				handleSuccess(data.redirectUrl);
			}
		},
	});

	const handleSubmit = async (data: {
		identifier: string;
		password: string;
	}) => {
		if (isPending) return;

		setErrorMessage(null);
		setValidationErrors({});

		await signInMutate({
			identifier: data.identifier,
			password: data.password,
			redirectUrl,
		});
	};

	return (
		<AuthLayout
			title="Welcome back"
			description="The universe is peer-reviewed. Jump back in."
			footerText="New here?"
			footerLinkText="Create an account"
			footerLinkTo="/sign-up"
		>
			<SignInForm
				onSubmit={handleSubmit}
				isPending={isPending}
				errorMessage={errorMessage}
				validationErrors={validationErrors}
			/>
		</AuthLayout>
	);
}
