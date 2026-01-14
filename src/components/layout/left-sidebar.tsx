import { useState, useRef } from "react";
import { Link } from "@tanstack/react-router";
import AppLogo from "~/components/ui/app-logo";
import { Home, Compass, Bell, Settings, LogOut, Plus } from "lucide-react";
import { CreateRatingModal } from "~/features/create-rating/components/create-rating-modal";
import authClient from "~/lib/core/auth-client";
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
	const isAuthenticated = user != null;
	const [isHolding, setIsHolding] = useState(false);
	const [holdProgress, setHoldProgress] = useState(0);
	const [showTooltip, setShowTooltip] = useState(false);
	const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
	const [header] = useState(() => getHeader());

	const handleLogout = async () => {
		await authClient.signOut();
		// navigate({ to: "/" }); // using navigate doesn't work for some reason >:(
		window.location.href = "/";
	};

	const handleMouseDown = () => {
		if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
		setIsHolding(true);
		setShowTooltip(true);
		setHoldProgress(0);

		const startTime = Date.now();
		const duration = 2000; // 2 seconds

		progressIntervalRef.current = setInterval(() => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min((elapsed / duration) * 100, 100);

			setHoldProgress(progress);

			if (progress >= 100) {
				if (progressIntervalRef.current) {
					clearInterval(progressIntervalRef.current);
				}

				handleLogout();
			}
		}, 16); // 60fps
	};

	const handleMouseUp = () => {
		setIsHolding(false);
		setHoldProgress(0);
		if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

		if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
		tooltipTimerRef.current = setTimeout(() => {
			setShowTooltip(false);
		}, 1000); // Hide tooltip after 1 second
	};

	const handleMouseEnter = () => {
		if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
		setShowTooltip(true);
	};

	const handleMouseLeave = () => {
		if (isHolding) {
			handleMouseUp();
		} else {
			if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
			tooltipTimerRef.current = setTimeout(() => {
				setShowTooltip(false);
			}, 3000);
		}
	};

	return (
		<>
			{isAuthenticated && (
				<CreateRatingModal
					isOpen={isCreateOpen}
					onClose={() => setIsCreateOpen(false)}
				/>
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
								className="w-full p-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-1 cursor-pointer"
							>
								<Plus className="w-5 h-5" />
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
							<div className="relative">
								<div
									className={`absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-[11px] font-medium text-neutral-300 whitespace-nowrap shadow-2xl pointer-events-none transition-all duration-200 ${
										showTooltip
											? "opacity-100 translate-y-0"
											: "opacity-0 translate-y-1"
									}`}
								>
									Tap and hold
									<div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-neutral-900 border-b border-r border-neutral-800 rotate-45" />
								</div>
								<button
									type="button"
									onMouseDown={handleMouseDown}
									onMouseUp={handleMouseUp}
									onMouseLeave={handleMouseLeave}
									onMouseEnter={handleMouseEnter}
									className="w-full flex items-center gap-4 px-3 py-3 text-neutral-400 hover:text-red-400 rounded-xl transition-all group cursor-pointer relative overflow-hidden outline-none"
								>
									<div
										className="absolute inset-0 bg-red-400/30 pointer-events-none transition-opacity duration-200"
										style={{
											width: `${holdProgress}%`,
											opacity: isHolding ? 1 : 0,
										}}
									/>
									<div className="relative flex items-center gap-4">
										<LogOut className="w-5 h-5" />
										<span className="font-medium">Logout</span>
									</div>
								</button>
							</div>
						</div>
					</div>
				)}
			</aside>

			{isAuthenticated && (
				<nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-neutral-950/80 backdrop-blur-md border-t border-neutral-800 px-6 py-3 flex justify-between md:justify-center md:space-x-24 items-center z-50">
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
						<Plus className="w-5 h-5" />
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
