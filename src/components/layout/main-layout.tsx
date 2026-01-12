import { MobileHeader } from "./mobile-header";
import { LeftSidebar } from "./left-sidebar";
import { RightSidebar } from "./right-sidebar";

export function MainLayout({
	user,
	children,
}: {
	user?: { username?: string; name?: string; image?: string };
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen bg-neutral-950 flex flex-col font-sans">
			<MobileHeader
				user={user ? { username: user.username ?? "" } : undefined}
			/>

			<div className="flex flex-1 justify-center">
				<LeftSidebar
					user={user ? { username: user.username ?? "" } : undefined}
				/>

				<main className="lg:border-x border-neutral-800 w-full max-w-2xl pb-16 lg:pb-0 overflow-hidden">
					{children}
				</main>

				<RightSidebar
					user={user ? { username: user.username ?? "" } : undefined}
				/>
			</div>
		</div>
	);
}
