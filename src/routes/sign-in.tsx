import {
	createFileRoute,
	redirect,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { useSignIn } from "~/features/sign-in/hooks";
import { AuthLayout } from "~/components/layout/auth-layout";
import { LoginForm } from "~/features/sign-in/components/LoginForm";
import {
	isAuthenticatedQueryOptions,
	useIsAuthenticated,
} from "~/features/session/queries";

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
	const { signIn, isPending, error, validationErrors } = useSignIn();
	const { isAuthenticated, isLoading } = useIsAuthenticated();

	const handleSubmit = async (data: {
		identifier: string;
		password: string;
	}) => {
		try {
			await signIn(data);
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
