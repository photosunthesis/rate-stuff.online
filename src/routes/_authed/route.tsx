import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authQueryOptions } from "~/domains/users/queries";

export const Route = createFileRoute("/_authed")({
	component: RouteComponent,
	beforeLoad: async ({ context }) => {
		const user = await context.queryClient.ensureQueryData({
			...authQueryOptions(),
			revalidateIfStale: true,
		});

		if (!user) {
			throw redirect({
				to: "/",
			});
		}

		if (!user.emailVerified) {
			throw redirect({
				to: "/verify-email",
			});
		}

		return {
			user: user,
		};
	},
});

function RouteComponent() {
	return <Outlet />;
}
