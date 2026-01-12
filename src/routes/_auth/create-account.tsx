import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "~/components/layout/auth-layout";
import { CreateAccountForm } from "~/features/create-account/components/create-account-form";
import { useCreateAccount } from "~/features/create-account/hooks";

export const Route = createFileRoute("/_auth/create-account")({
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
	const { createAccount, isPending, errorMessage, validationErrors } =
		useCreateAccount();

	const handleSubmit = async (data: {
		inviteCode: string;
		username: string;
		email: string;
		password: string;
		confirmPassword: string;
	}) => {
		await createAccount(data);
	};

	return (
		<AuthLayout
			title="Join the community"
			description="Your account. Your ratings. One to ten. Start here."
			footerText="Already have an account?"
			footerLinkText="Sign in"
			footerLinkTo="/sign-in"
		>
			<CreateAccountForm
				onSubmit={handleSubmit}
				isPending={isPending}
				errorMessage={errorMessage}
				validationErrors={validationErrors}
			/>
		</AuthLayout>
	);
}
