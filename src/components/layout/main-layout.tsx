import { MobileHeader } from "./mobile-header";
import { LeftSidebar } from "./left-sidebar";
import { RightSidebar } from "./right-sidebar";
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

				<main className="lg:border-x border-neutral-800 w-full max-w-2xl pb-16 lg:pb-0 overflow-hidden">
					{children}
				</main>

				<RightSidebar user={user} />
			</div>
		</div>
	);
}
