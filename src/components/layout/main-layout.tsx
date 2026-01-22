import { MobileHeader } from "./mobile-header";
import { LeftSidebar } from "./left-sidebar";
import { RightSidebar } from "./right-sidebar";
import { DiscoverStrip } from "./discover-strip";
import type { PublicUser } from "~/features/auth/types";
import usePartySocket from "partysocket/react";
import { useQueryClient } from "@tanstack/react-query";
import { activityKeys } from "~/features/activity/queries";

const PARTYKIT_HOST =
	import.meta.env.VITE_PARTYKIT_URL || "http://127.0.0.1:1999";

export function MainLayout({
	user,
	showDiscoverStrip = false,
	children,
}: {
	user?: PublicUser;
	showDiscoverStrip?: boolean;
	children: React.ReactNode;
}) {
	const queryClient = useQueryClient();

	usePartySocket({
		host: PARTYKIT_HOST,
		room: user ? `user-${user.id}` : "anon",
		onMessage(event) {
			if (event.data === "NEW_ACTIVITY") {
				queryClient.invalidateQueries({ queryKey: activityKeys.all });
			}
		},
	});

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

				<RightSidebar user={user} />
			</div>
		</div>
	);
}
