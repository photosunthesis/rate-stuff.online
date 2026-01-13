import { createFileRoute, Outlet } from "@tanstack/react-router";
import { authQueryOptions } from "~/lib/features/auth/queries";

export const Route = createFileRoute("/stuff")({
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
