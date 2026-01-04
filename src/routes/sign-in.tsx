import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useLogin } from "~/features/auth/hooks";
import { AuthLayout } from "~/features/auth/components/auth-layout";
import { LoginForm } from "~/features/auth/components/login-form";

export const Route = createFileRoute("/sign-in")({
	component: RouteComponent,
	head: () => ({
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
	}),
});

function RouteComponent() {
	const navigate = useNavigate();
	const { login, isPending, error, validationErrors } = useLogin();

	const handleSubmit = async (data: {
		identifier: string;
		password: string;
	}) => {
		try {
			await login(data);
			navigate({ to: "/" });
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
			<LoginForm
				onSubmit={handleSubmit}
				isPending={isPending}
				error={error}
				validationErrors={validationErrors}
			/>
		</AuthLayout>
	);
}
