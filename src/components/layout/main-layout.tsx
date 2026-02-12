import { MobileHeader } from "./mobile-header";
import { LeftSidebar } from "./left-sidebar";
import { RightSidebar } from "./right-sidebar";
import { DiscoverStrip } from "../ui/content/discover-strip";
import type { PublicUser } from "~/domains/users/types";
import { useActivitySocket } from "~/hooks/use-activity-socket";

export function MainLayout({
	user,
	showDiscoverStrip = false,
	children,
}: {
	user?: PublicUser;
	showDiscoverStrip?: boolean;
	children: React.ReactNode;
}) {
	useActivitySocket(user?.id);

	return (
		<div className="min-h-screen bg-neutral-950 flex flex-col font-sans">
			<MobileHeader user={user} />

			<div className="flex flex-1 justify-center">
				<LeftSidebar user={user} />

				<div className="w-full max-w-2xl flex flex-col">
					{showDiscoverStrip && <DiscoverStrip user={user} />}

					<main className="flex-1 md:border-x border-neutral-800 w-full pb-16 lg:pb-0 overflow-hidden">
						{children}
					</main>
				</div>

				<div className="hidden md:block lg:hidden w-20" />

				<RightSidebar user={user} />
			</div>
		</div>
	);
}
