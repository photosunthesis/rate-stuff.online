import { createFileRoute } from "@tanstack/react-router";
import { MainLayout } from "~/components/layout/main-layout";
import { authQueryOptions } from "~/features/auth/queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { mapToCurrentUser } from "~/utils/user-mapping";

export const Route = createFileRoute("/_authed/activity")({
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
	const { data: user } = useSuspenseQuery(authQueryOptions());
	const currentUser = mapToCurrentUser(user);

	return (
		<MainLayout user={currentUser}>
			<div className="flex items-center justify-center h-[50vh]">
				<span className="text-md text-neutral-400">
					Feature will be implemented soon(ish) (￣▽￣*)ゞ
				</span>
			</div>
		</MainLayout>
	);
}
