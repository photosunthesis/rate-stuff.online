import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import authClient from "~/domains/users/auth/client";
import { AuthLayout } from "~/domains/users/components/auth-layout";
import { SignUpForm } from "~/domains/users/components/sign-up-form";
import { authQueryOptions } from "~/domains/users/queries";
import { registerSchema } from "~/domains/users/types";
import { withTimeout } from "~/utils/timeout";
import { useUmami } from "@danielgtmn/umami-react";

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
	const umami = useUmami();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [validationErrors, setValidationErrors] = useState({});

	const { mutateAsync: signUpMutate, isPending } = useMutation({
		mutationFn: async (data: {
			username: string;
			email: string;
			password: string;
			terms: boolean;
		}) => {
			setErrorMessage(null);
			setValidationErrors({});

			const parseResult = registerSchema.safeParse(data);

			if (!parseResult.success) {
				const errors: Record<string, string> = {};
				for (const issue of parseResult.error.issues) {
					errors[issue.path[0] as string] = issue.message;
				}
				setValidationErrors(errors);
				throw new Error("Validation failed");
			}

			const { error } = await withTimeout(
				authClient.signUp.email({
					name: data.username, //  We'll let the user change this later
					username: data.username,
					email: data.email,
					password: data.password,
				}),
				{ context: "sign-up" },
			);

			if (error) {
				setErrorMessage(
					error.message ?? `Failed to sign up due to an error: ${error}`,
				);
				throw error;
			}

			queryClient.removeQueries({
				queryKey: authQueryOptions().queryKey,
			});

			navigate({
				to: "/verify-email",
				search: { e: btoa(data.email) },
			});

			if (error) throw error;
		},
	});

	const handleSubmit = async (data: {
		username: string;
		email: string;
		password: string;
		terms: boolean;
	}) => {
		if (isPending) return;
		await signUpMutate(data);
		if (umami) umami.track("signup", { method: "email" });
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
				isPending={isPending}
				errorMessage={errorMessage}
				validationErrors={validationErrors}
			/>
		</AuthLayout>
	);
}
