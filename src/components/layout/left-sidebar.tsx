import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import AppLogo from "~/components/ui/app-logo";
import {
	Home,
	Compass,
	Bell,
	Settings,
	LogOut,
	PencilLine,
} from "lucide-react";
import { CreateRatingModal } from "~/features/create-rating/components/create-rating-modal";
import { ConfirmModal } from "~/components/ui/confirm-modal";
import type { PublicUser } from "~/features/auth/types";
import { useSignOut } from "~/hooks/use-sign-out";
import { unreadActivityCountQueryOptions } from "~/features/activity/queries";
import { useSuspenseQuery } from "@tanstack/react-query";

const getHeader = () => {
	const headers = [
		"Rate literally anything.",
		"Give something a score.",
		"Rate reality, one to ten.",
		"Everything gets a score.",
		"The world, out of ten.",
		"Rate the whole universe.",
		"Your opinion, now numbered.",
	];

	const now = new Date();
	const hourSeed =
		now.getUTCFullYear() +
		now.getUTCMonth() +
		now.getUTCDate() +
		now.getUTCHours();

	return headers[hourSeed % headers.length];
};

export function LeftSidebar({ user }: { user?: PublicUser }) {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isSignOutOpen, setIsSignOutOpen] = useState(false);
	const isAuthenticated = user != null;
	const [header] = useState(() => getHeader());
	const location = useLocation();
	const { signOut } = useSignOut();
	const showFloatingButton =
		location.pathname === "/" || location.pathname === "/explore";
	const { data: unreadCount } = useSuspenseQuery(
		unreadActivityCountQueryOptions(user?.id),
	);

	return (
		<>
			{isAuthenticated && (
				<>
					<CreateRatingModal
						isOpen={isCreateOpen}
						onClose={() => setIsCreateOpen(false)}
					/>
					<ConfirmModal
						destructive
						isOpen={isSignOutOpen}
						onClose={() => setIsSignOutOpen(false)}
						title="Ready to sign out?"
						description="After signing out, you can sign back in anytime."
						confirmLabel="Sign out"
						onConfirm={signOut}
					/>
				</>
			)}
			<aside className="w-64 px-4 py-6 hidden lg:flex flex-col sticky top-0 h-screen">
				<div className="flex flex-col gap-2 mb-4 pl-3">
					<AppLogo size={30} />
					{!isAuthenticated && (
						<h1
							className="text-lg font-semibold text-white"
							suppressHydrationWarning
						>
							{header}
						</h1>
					)}
				</div>
				{!isAuthenticated ? (
					<div className="space-y-2 px-3">
						<Link
							to="/sign-up"
							className="w-full px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors text-base flex items-center justify-center"
						>
							Create Account
						</Link>
						<Link
							to="/sign-in"
							search={{ redirect: undefined }}
							className="w-full px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl border border-neutral-700 transition-colors text-base flex items-center justify-center"
						>
							Sign In
						</Link>
					</div>
				) : (
					<div className="flex flex-col h-full">
						<nav className="space-y-1">
							<Link
								to="/"
								activeOptions={{ exact: true }}
								className="flex items-center gap-4 px-3 py-2 text-neutral-500 hover:text-white hover:bg-neutral-800/50 rounded-xl transition-all group outline-none"
								activeProps={{ className: "text-white font-bold" }}
							>
								<Home className="w-5 h-5" />
								<span className="font-medium">Home</span>
							</Link>
							<Link
								to="/explore"
								className="flex items-center gap-4 px-3 py-2 text-neutral-500 hover:text-white hover:bg-neutral-800/50 rounded-xl transition-all group outline-none"
								activeProps={{ className: "text-white font-bold" }}
							>
								<Compass className="w-5 h-5" />
								<span className="font-medium">Explore</span>
							</Link>
							<Link
								to="/activity"
								className="flex items-center gap-4 px-3 py-2 text-neutral-500 hover:text-white hover:bg-neutral-800/50 rounded-xl transition-all group outline-none"
								activeProps={{ className: "text-white font-bold" }}
							>
								<div className="relative">
									<Bell className="w-5 h-5" />
									{unreadCount > 0 && (
										<span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
											<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
											<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
										</span>
									)}
								</div>
								<span className="font-medium">Activity</span>
							</Link>
							<Link
								to="/settings"
								className="flex items-center gap-4 px-3 py-2 text-neutral-500 hover:text-white hover:bg-neutral-800/50 rounded-xl transition-all group outline-none"
								activeProps={{ className: "bg-neutral-800/50 text-white" }}
							>
								<Settings className="w-5 h-5" />
								<span className="font-medium">Settings</span>
							</Link>
						</nav>

						<div className="my-6 px-3">
							<button
								type="button"
								onClick={() => setIsCreateOpen(true)}
								className="w-full p-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors text-base flex items-center justify-center gap-2 cursor-pointer"
							>
								<PencilLine className="w-4 h-4 shrink-0" />
								<span className="truncate">New Rating</span>
							</button>
						</div>

						<div className="mt-auto">
							<button
								type="button"
								onClick={() => setIsSignOutOpen(true)}
								className="w-full flex items-center gap-4 px-3 py-2 text-neutral-500 hover:text-red-400 hover:bg-neutral-800/50 rounded-xl transition-all group cursor-pointer outline-none"
							>
								<LogOut className="w-5 h-5" />
								<span className="font-medium">Sign Out</span>
							</button>
						</div>
					</div>
				)}
			</aside>

			{isAuthenticated && (
				<aside className="hidden md:flex lg:hidden flex-col items-center sticky top-0 h-screen w-20 px-2 py-6">
					<div className="flex flex-col gap-4 items-center mb-4">
						<AppLogo size={26} />
					</div>
					<div className="flex-1 flex flex-col items-center justify-start space-y-2">
						<Link
							to="/"
							activeOptions={{ exact: true }}
							title="Home"
							className="p-2 text-neutral-500 hover:text-white rounded-lg transition-colors"
							activeProps={{ className: "text-white" }}
						>
							<Home className="w-6 h-6" />
						</Link>
						<Link
							to="/explore"
							title="Explore"
							className="p-2 text-neutral-500 hover:text-white rounded-lg transition-colors"
							activeProps={{ className: "text-white" }}
						>
							<Compass className="w-6 h-6" />
						</Link>
						<Link
							to="/activity"
							title="Activity"
							className="p-2 text-neutral-500 hover:text-white rounded-lg transition-colors"
							activeProps={{ className: "text-white" }}
						>
							<div className="relative">
								<Bell className="w-6 h-6" />
								{unreadCount > 0 && (
									<span className="absolute -top-1 -right-1 flex h-3 w-3">
										<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
										<span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
									</span>
								)}
							</div>
						</Link>
						<Link
							to="/settings"
							title="Settings"
							className="p-2 text-neutral-500 hover:text-white rounded-lg transition-colors"
						>
							<Settings className="w-6 h-6" />
						</Link>
					</div>

					<div className="mb-4">
						<button
							type="button"
							onClick={() => setIsCreateOpen(true)}
							aria-label="New Rating"
							title="New Rating"
							className="bg-emerald-500 hover:bg-emerald-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow"
						>
							<PencilLine className="w-4 h-4" />
						</button>
					</div>

					<button
						type="button"
						onClick={() => setIsSignOutOpen(true)}
						className="mb-6 p-2 text-neutral-500 hover:text-red-400 rounded-lg transition-colors"
					>
						<LogOut className="w-5 h-5" />
					</button>
				</aside>
			)}

			{isAuthenticated && (
				<nav className="md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-lg border-t border-white/5 px-6 py-3 flex justify-between md:justify-center md:space-x-24 items-center z-50">
					<div className="absolute inset-0 bg-linear-to-t from-neutral-950/95 via-neutral-950/60 to-neutral-950/10 -z-10" />
					<Link
						to="/"
						activeOptions={{ exact: true }}
						className="flex flex-col items-center gap-1 text-neutral-500 hover:text-white transition-colors"
						activeProps={{ className: "text-white" }}
					>
						<Home className="w-6 h-6" />
						<span className="text-[10px] font-medium">Home</span>
					</Link>

					{showFloatingButton && (
						<button
							type="button"
							onClick={() => setIsCreateOpen(true)}
							aria-label="New Rating"
							title="New Rating"
							className="absolute -top-18 right-4 md:-right-16 bg-emerald-500 hover:bg-emerald-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-50"
						>
							<PencilLine className="w-5 h-5" />
						</button>
					)}
					<Link
						to="/explore"
						className="flex flex-col items-center gap-1 text-neutral-500 hover:text-white transition-colors"
						activeProps={{ className: "text-white" }}
					>
						<Compass className="w-6 h-6" />
						<span className="text-[10px] font-medium">Explore</span>
					</Link>
					<Link
						to="/activity"
						className="flex flex-col items-center gap-1 text-neutral-500 hover:text-white transition-colors"
						activeProps={{ className: "text-white" }}
					>
						<div className="relative">
							<Bell className="w-6 h-6" />
							{unreadCount > 0 && (
								<span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
									<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
								</span>
							)}
						</div>
						<span className="text-[10px] font-medium">Activity</span>
					</Link>
					<Link
						to="/settings"
						className="flex flex-col items-center gap-1 text-neutral-500 hover:text-white transition-colors"
						activeProps={{ className: "text-white" }}
					>
						<Settings className="w-6 h-6" />
						<span className="text-[10px] font-medium">Settings</span>
					</Link>
				</nav>
			)}
		</>
	);
}
