import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authQueryOptions } from "~/lib/auth/queries";

export const Route = createFileRoute("/_auth")({
	component: RouteComponent,
	beforeLoad: async ({ context }) => {
		const REDIRECT_URL = "/";

		const user = await context.queryClient.ensureQueryData({
			...authQueryOptions(),
			revalidateIfStale: true,
		});

		if (user) {
			throw redirect({
				to: REDIRECT_URL,
			});
		}

		return {
			redirectUrl: REDIRECT_URL,
		};
	},
});

function RouteComponent() {
	return <Outlet />;
}
