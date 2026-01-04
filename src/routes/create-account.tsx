import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRegister } from "~/features/auth/hooks";
import { AuthLayout } from "~/features/auth/components/auth-layout";
import { RegisterForm } from "~/features/auth/components/register-form";

export const Route = createFileRoute("/create-account")({
	component: RouteComponent,
	head: () => ({
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
	}),
});

function RouteComponent() {
	const navigate = useNavigate();
	const { register, isPending, error, validationErrors } = useRegister();

	const handleSubmit = async (data: {
		inviteCode: string;
		username: string;
		displayName: string;
		email: string;
		password: string;
		confirmPassword: string;
	}) => {
		try {
			await register(data);
			navigate({ to: "/" });
		} catch {}
	};

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
				error={error}
				validationErrors={validationErrors}
			/>
		</AuthLayout>
	);
}
