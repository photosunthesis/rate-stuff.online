import { MobileHeader } from "./mobile-header";
import { LeftSidebar } from "./left-sidebar";
import { RightSidebar } from "./right-sidebar";
import { DiscoverStrip } from "~/features/ratings/components/discover-strip";
import { useActivitySocket } from "~/features/activity/use-activity-socket";
import { useAuth } from "~/features/auth/hooks";

export function MainLayout({
	showDiscoverStrip = false,
	children,
}: {
	showDiscoverStrip?: boolean;
	children: React.ReactNode;
}) {
	const { data: user } = useAuth();
	const wsConnected = useActivitySocket(user?.id);

	return (
		<div className="min-h-screen bg-neutral-950 flex flex-col font-sans">
			<MobileHeader />

			<div className="flex flex-1 justify-center">
				<LeftSidebar wsConnected={wsConnected} />

				<div className="w-full max-w-2xl flex flex-col">
					{showDiscoverStrip && <DiscoverStrip />}

					<main className="flex-1 md:border-x border-neutral-800 w-full pb-28 lg:pb-0 overflow-hidden">
						{children}
					</main>
				</div>

				<div className="hidden md:block lg:hidden w-20" />

				<RightSidebar />
			</div>
		</div>
	);
}
