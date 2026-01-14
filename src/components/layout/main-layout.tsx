import { MobileHeader } from "./mobile-header";
import { LeftSidebar } from "./left-sidebar";
import { RightSidebar } from "./right-sidebar";
import { DiscoverStrip } from "./discover-strip";
import type { PublicUser } from "~/lib/features/auth/types";

export function MainLayout({
	user,
	children,
}: {
	user?: PublicUser;
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen bg-neutral-950 flex flex-col font-sans">
			<MobileHeader user={user} />

			<div className="flex flex-1 justify-center">
				<LeftSidebar user={user} />

				<div className="w-full max-w-2xl">
					{/* Discover strip is only shown on tablet/mobile, on desktop, the right sidebar is shown */}
					<DiscoverStrip user={user} />

					<main className="md:border-x border-neutral-800 w-full pb-16 lg:pb-0 overflow-hidden px-4">
						{children}
					</main>
				</div>

				<RightSidebar user={user} />
			</div>
		</div>
	);
}
