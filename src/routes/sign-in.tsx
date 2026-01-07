import {
	createFileRoute,
	redirect,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { useLogin } from "~/features/auth/hooks";
import { AuthLayout } from "~/features/auth/components/auth-layout";
import { LoginForm } from "~/features/auth/components/login-form";
import {
	isAuthenticatedQueryOptions,
	useIsAuthenticated,
} from "~/features/auth/queries";

export const Route = createFileRoute("/sign-in")({
	beforeLoad: async ({ context }) => {
		const isAuthenticated = await context.queryClient.ensureQueryData(
			isAuthenticatedQueryOptions(),
		);
		if (isAuthenticated) {
			throw redirect({ to: "/" });
		}
	},
	component: RouteComponent,
	validateSearch: (search: Record<string, unknown>) => ({
		redirect: search.redirect as string | undefined,
	}),
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
	const search = useSearch({ from: "/sign-in" });
	const { login, isPending, error, validationErrors } = useLogin();
	const { isAuthenticated, isLoading } = useIsAuthenticated();

	const handleSubmit = async (data: {
		identifier: string;
		password: string;
	}) => {
		try {
			await login(data);
			const redirectTo = search.redirect || "/";
			navigate({ to: redirectTo });
		} catch {}
	};

	if (isAuthenticated || isLoading) {
		return null;
	}

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
