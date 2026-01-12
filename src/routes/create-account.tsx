import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useCreateAccount } from "~/features/create-account/hooks";
import { AuthLayout } from "~/components/layout/auth-layout";
import { RegisterForm } from "~/features/create-account/components/register-form";
import {
	isAuthenticatedQueryOptions,
	useIsAuthenticated,
} from "~/features/session/queries";

export const Route = createFileRoute("/create-account")({
	beforeLoad: async ({ context }) => {
		const isAuthenticated = await context.queryClient.ensureQueryData(
			isAuthenticatedQueryOptions(),
		);

		if (isAuthenticated) {
			throw redirect({ to: "/" });
		}
	},
	component: RouteComponent,
	head: ({ match }) => {
		const isAuthenticated = match.context.queryClient.getQueryData(
			isAuthenticatedQueryOptions().queryKey,
		);

		if (isAuthenticated) {
			return {
				meta: [
					{
						title: "Redirecting... - Rate Stuff Online",
					},
				],
			};
		}

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
	const navigate = useNavigate();
	const { createAccount, isPending, errorMessage, validationErrors } =
		useCreateAccount();
	const { isAuthenticated, isLoading } = useIsAuthenticated();

	const handleSubmit = async (data: {
		inviteCode: string;
		username: string;
		email: string;
		password: string;
		confirmPassword: string;
	}) => {
		try {
			await createAccount(data);
			navigate({ to: "/set-up-profile" });
		} catch {}
	};

	if (isAuthenticated || isLoading) {
		return null;
	}

	return (
		<AuthLayout
			title="Join the community"
			description="Your account. Your ratings. One to ten. Start here."
			footerText="Already have an account?"
			footerLinkText="Sign in"
			footerLinkTo="/sign-in"
		>
			<RegisterForm
				onSubmit={handleSubmit}
				isPending={isPending}
				errorMessage={errorMessage}
				validationErrors={validationErrors}
			/>
		</AuthLayout>
	);
}
