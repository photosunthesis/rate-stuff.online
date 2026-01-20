import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import authClient from "~/auth/auth.client";
import {
	markInviteCodeAsUsedFn,
	validateInviteCodeFn,
} from "~/features/auth/functions";
import { AuthLayout } from "~/features/auth/components/auth-layout";
import { SignUpForm } from "~/features/auth/components/sign-up-form";
import { authQueryOptions } from "~/features/auth/queries";
import { registerSchema } from "~/features/auth/types";
import { withTimeout } from "~/utils/timeout";

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
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [validationErrors, setValidationErrors] = useState({});
	const validateInviteCode = useServerFn(validateInviteCodeFn);
	const markInviteCodeAsUsed = useServerFn(markInviteCodeAsUsedFn);

	const { mutateAsync: signUpMutate, isPending } = useMutation({
		mutationFn: async (data: {
			username: string;
			email: string;
			password: string;
			inviteCode: string;
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
				return;
			}

			const validCodeResult = await validateInviteCode({
				data: { inviteCode: data.inviteCode },
			});

			if (!validCodeResult.success) {
				setValidationErrors({
					inviteCode: "Invalid invite code",
				});
				return;
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
				return;
			}

			queryClient.removeQueries({
				queryKey: authQueryOptions().queryKey,
			});

			await markInviteCodeAsUsed({
				data: { inviteCode: data.inviteCode },
			});

			navigate({ to: "/set-up-profile" });

			if (error) throw error;
		},
	});

	const handleSubmit = async (data: {
		username: string;
		email: string;
		password: string;
		inviteCode: string;
		terms: boolean;
	}) => {
		if (isPending) return;
		await signUpMutate(data);
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
