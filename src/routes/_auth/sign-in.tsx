import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSignIn } from "~/features/sign-in/hooks";
import { AuthLayout } from "~/components/layout/auth-layout";
import { SignInForm } from "~/features/sign-in/components/sig-in-form";

export const Route = createFileRoute("/_auth/sign-in")({
	component: RouteComponent,
	validateSearch: (search: Record<string, unknown>) => ({
		redirect: search.redirect as string | undefined,
	}),
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
	const navigate = useNavigate();
	const redirectUrl = Route.useRouteContext().redirectUrl;
	const { signIn, isPending, errorMessage, validationErrors } = useSignIn();

	const handleSubmit = async (data: {
		identifier: string;
		password: string;
	}) => {
		try {
			await signIn(data);
			const redirectTo = redirectUrl || "/";
			navigate({ to: redirectTo });
		} catch {}
	};

	return (
		<AuthLayout
			title="Welcome back"
			description="The universe is peer-reviewed. Jump back in."
			footerText="New here?"
			footerLinkText="Create an account"
			footerLinkTo="/create-account"
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
