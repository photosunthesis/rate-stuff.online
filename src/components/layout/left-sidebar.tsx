import { useState } from "react";
import { Link } from "@tanstack/react-router";
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
import authClient from "~/lib/auth.client";
import type { PublicUser } from "~/features/auth/types";

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

	return headers[Math.floor(Math.random() * headers.length)];
};

export function LeftSidebar({ user }: { user?: PublicUser }) {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isSignOutOpen, setIsSignOutOpen] = useState(false);
	const isAuthenticated = user != null;
	const [header] = useState(() => getHeader());

	const handleSignOut = async () => {
		await authClient.signOut();
		window.location.href = "/"; // Using useNavigate doesn't work for some reason 🤷🏻
	};

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
						description="You will be signed out. Come back anytime."
						confirmLabel="Sign out"
						onConfirm={handleSignOut}
					/>
				</>
			)}
			<aside className="w-64 px-4 py-6 hidden lg:flex flex-col sticky top-0 h-screen">
				<div className="flex flex-col gap-2 mb-4">
					<AppLogo size={30} />
					{!isAuthenticated && (
						<h1
							className="text-xl font-semibold text-white"
							suppressHydrationWarning
						>
							{header}
						</h1>
					)}
				</div>
				{!isAuthenticated ? (
					<div className="space-y-2">
						<Link
							to="/sign-up"
							className="w-full px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center"
						>
							Create Account
						</Link>
						<Link
							to="/sign-in"
							search={{ redirect: undefined }}
							className="w-full px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl border border-neutral-700 transition-colors text-sm flex items-center justify-center"
						>
							Sign In
						</Link>
					</div>
				) : (
					<div className="flex flex-col h-full">
						<div className="mb-6 mt-4 px-3">
							<button
								type="button"
								onClick={() => setIsCreateOpen(true)}
								className="w-full p-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
							>
								<PencilLine className="w-5 h-5" />
								<span>New Rating</span>
							</button>
						</div>
						<nav className="space-y-1 flex-1">
							<Link
								to="/"
								activeOptions={{ exact: true }}
								className="flex items-center gap-4 px-3 py-3 text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-xl transition-all group outline-none"
								activeProps={{ className: "text-white bg-neutral-800/80" }}
							>
								{({ isActive }) => (
									<>
										<Home
											className="w-5 h-5"
											fill={isActive ? "currentColor" : "none"}
										/>
										<span className="font-medium">Home</span>
									</>
								)}
							</Link>
							<Link
								to="/"
								className="flex items-center gap-4 px-3 py-3 text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-xl transition-all group outline-none"
							>
								<Compass className="w-5 h-5" fill="none" />
								<span className="font-medium">Explore</span>
							</Link>
							<Link
								to="/"
								className="flex items-center gap-4 px-3 py-3 text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-xl transition-all group outline-none"
							>
								<Bell className="w-5 h-5" fill="none" />
								<span className="font-medium">Activity</span>
							</Link>
							<Link
								to="/"
								className="flex items-center gap-4 px-3 py-3 text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-xl transition-all group outline-none"
							>
								<Settings className="w-5 h-5" fill="none" />
								<span className="font-medium">Settings</span>
							</Link>
						</nav>

						<div className="mt-auto">
							<button
								type="button"
								onClick={() => setIsSignOutOpen(true)}
								className="w-full flex items-center gap-4 px-3 py-3 text-neutral-400 hover:text-red-400 hover:bg-red-700/20 rounded-xl transition-all group cursor-pointer outline-none"
							>
								<LogOut className="w-5 h-5" />
								<span className="font-medium">Sign Out</span>
							</button>
						</div>
					</div>
				)}
			</aside>

			{/* Tablet icon-only sidebar */}
			<aside className="hidden md:flex lg:hidden flex-col items-center sticky top-0 h-screen w-20 px-2 py-6">
				<div className="flex flex-col gap-4 items-center mb-4">
					<AppLogo size={26} />
				</div>
				<div className="flex-1 flex flex-col items-center justify-start space-y-2">
					<Link
						to="/"
						activeOptions={{ exact: true }}
						title="Home"
						className="p-2 text-neutral-400 hover:text-white rounded-lg transition-colors"
						activeProps={{ className: "text-white" }}
					>
						{({ isActive }) => (
							<Home
								className="w-6 h-6"
								fill={isActive ? "currentColor" : "none"}
							/>
						)}
					</Link>
					<Link
						to="/"
						title="Explore"
						className="p-2 text-neutral-400 hover:text-white rounded-lg transition-colors"
					>
						<Compass className="w-6 h-6" fill="none" />
					</Link>
					<Link
						to="/"
						title="Activity"
						className="p-2 text-neutral-400 hover:text-white rounded-lg transition-colors"
					>
						<Bell className="w-6 h-6" fill="none" />
					</Link>
					<Link
						to="/"
						title="Settings"
						className="p-2 text-neutral-400 hover:text-white rounded-lg transition-colors"
					>
						<Settings className="w-6 h-6" fill="none" />
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

				{isAuthenticated && (
					<button
						type="button"
						onClick={() => setIsSignOutOpen(true)}
						className="mb-6 p-2 text-neutral-400 hover:text-red-400 rounded-lg transition-colors"
					>
						<LogOut className="w-5 h-5" />
					</button>
				)}
			</aside>

			{isAuthenticated && (
				<nav className="md:hidden fixed bottom-0 left-0 right-0 bg-neutral-950/80 backdrop-blur-md border-t border-neutral-800 px-6 py-3 flex justify-between md:justify-center md:space-x-24 items-center z-50">
					<Link
						to="/"
						activeOptions={{ exact: true }}
						className="flex flex-col items-center gap-1 text-neutral-400 hover:text-white transition-colors"
						activeProps={{ className: "text-white" }}
					>
						{({ isActive }) => (
							<>
								<Home
									className="w-6 h-6"
									fill={isActive ? "currentColor" : "none"}
								/>
								<span className="text-[10px] font-medium">Home</span>
							</>
						)}
					</Link>

					<button
						type="button"
						onClick={() => setIsCreateOpen(true)}
						aria-label="New Rating"
						title="New Rating"
						className="absolute -top-14 right-4 md:-right-16 bg-emerald-500 hover:bg-emerald-600 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center z-50"
					>
						<PencilLine className="w-5 h-5" />
					</button>
					<Link
						to="/"
						className="flex flex-col items-center gap-1 text-neutral-400 hover:text-white transition-colors"
					>
						<Compass className="w-6 h-6" fill="none" />
						<span className="text-[10px] font-medium">Explore</span>
					</Link>
					<Link
						to="/"
						className="flex flex-col items-center gap-1 text-neutral-400 hover:text-white transition-colors"
					>
						<Bell className="w-6 h-6" fill="none" />
						<span className="text-[10px] font-medium">Activity</span>
					</Link>
					<Link
						to="/"
						className="flex flex-col items-center gap-1 text-neutral-400 hover:text-white transition-colors"
					>
						<Settings className="w-6 h-6" fill="none" />
						<span className="text-[10px] font-medium">Settings</span>
					</Link>
				</nav>
			)}
		</>
	);
}
