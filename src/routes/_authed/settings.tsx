import { createFileRoute, Link } from "@tanstack/react-router";
import { Avatar } from "~/components/ui/avatar";
import { useSuspenseQuery } from "@tanstack/react-query";
import { authQueryOptions } from "~/features/auth/queries";
import { mapToCurrentUser } from "~/utils/user-mapping";
import authClient from "~/auth/auth.client";
import { LogOut, ChevronRight } from "lucide-react";
import { useState } from "react";
import { ConfirmModal } from "~/components/ui/confirm-modal";
import { MainLayout } from "~/components/layout/main-layout";

export const Route = createFileRoute("/_authed/settings")({
	component: SettingsPage,
	head: () => ({
		meta: [
			{ title: "Settings - Rate Stuff Online" },
			{ name: "robots", content: "noindex, follow" },
		],
	}),
});

function SettingsPage() {
	const { data: user } = useSuspenseQuery(authQueryOptions());
	const [isSignOutOpen, setIsSignOutOpen] = useState(false);

	if (!user) return null;

	const handleSignOut = async () => {
		await authClient.signOut();
		window.location.href = "/";
	};

	const currentUser = mapToCurrentUser(user);

	return (
		<MainLayout user={currentUser}>
			<ConfirmModal
				destructive
				isOpen={isSignOutOpen}
				onClose={() => setIsSignOutOpen(false)}
				title="Ready to sign out?"
				description="After signing out, you can sign back in anytime."
				confirmLabel="Sign out"
				onConfirm={handleSignOut}
			/>

			<div className="w-full flex flex-col h-full">
				<div className="px-4 py-6 space-y-6 flex-1 max-w-3xl mx-auto w-full">
					{/* Profile Card */}
					<div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
						<Link
							to="/set-up-profile"
							search={{ redirect: "/settings" }}
							className="block hover:bg-neutral-800/50 transition-colors p-4"
						>
							<div className="flex items-center gap-4">
								<Avatar
									src={user.image ?? null}
									alt={user.name || "User"}
									size="lg"
								/>
								<div className="flex-1 min-w-0">
									<h3 className="text-md font-semibold text-white truncate">
										{user.name || "User"}
									</h3>
									<p className="text-sm text-neutral-400 truncate">
										@{user.username}
									</p>
								</div>
								<ChevronRight className="w-5 h-5 text-neutral-500" />
							</div>
						</Link>
					</div>

					{/* Settings List Card */}
					<div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
						{/* Sign Out Item */}
						<button
							type="button"
							onClick={() => setIsSignOutOpen(true)}
							className="w-full flex items-center justify-between p-4 hover:bg-neutral-800/50 transition-colors text-left cursor-pointer"
						>
							<div className="flex items-center gap-3">
								<div className="flex flex-col gap-1">
									<span className="text-md font-medium ">Sign Out</span>
									<span className="text-sm text-neutral-400">
										Sign out of your account
									</span>
								</div>
							</div>
							<LogOut className="w-5 h-5 text-neutral-500" />
						</button>
					</div>
				</div>

				{/* Links Section */}
				<div className="mt-8 border-t border-neutral-800">
					<div className="p-6">
						<div className="flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-3 text-sm text-neutral-500">
							<Link
								to="/terms"
								className="text-xs text-neutral-500 hover:underline transition-colors"
							>
								Terms & Conditions
							</Link>
							<Link
								to="/privacy"
								className="text-xs text-neutral-500 hover:underline transition-colors"
							>
								Privacy Policy
							</Link>
							<a
								href="mailto:hello@rate-stuff.online"
								className="text-xs text-neutral-500 hover:underline transition-colors"
							>
								Contact Us
							</a>
							<a
								href="https://github.com/photosunthesis/rate-stuff.online"
								target="_blank"
								rel="noopener noreferrer"
								className="text-xs text-neutral-500 hover:underline transition-colors"
							>
								GitHub
							</a>
							<div className="text-xs text-neutral-500">
								{`© 2025-${new Date().getFullYear()} Rate Stuff Online`}
							</div>
						</div>
					</div>
				</div>
			</div>
		</MainLayout>
	);
}
