import { createFileRoute, Outlet } from "@tanstack/react-router";
import { authQueryOptions } from "~/domains/users/queries";

export const Route = createFileRoute("/_public")({
	component: RouteComponent,
	beforeLoad: async ({ context }) => {
		const user = await context.queryClient.ensureQueryData({
			...authQueryOptions(),
			revalidateIfStale: true,
		});

		return { user };
	},
});

function RouteComponent() {
	return <Outlet />;
}
