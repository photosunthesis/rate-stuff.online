import { useState, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import AppLogo from "~/components/app-logo";
import { useIsAuthenticated, useLogoutMutation } from "~/features/auth/queries";
import { Home, Star, Bell, Settings, LogOut } from "lucide-react";

const headers = [
	"Rate the whole universe.",
	"Score everything, regret nothing.",
	"Rate reality, one to ten.",
	"Grade the cosmic soup.",
	"Everything gets a score.",
	"Your opinion, now numbered.",
	"The world, out of ten.",
];

export function LeftSidebar() {
	const { isAuthenticated } = useIsAuthenticated();
	const logoutMutation = useLogoutMutation();
	const navigate = useNavigate();

	const [header] = useState(
		() => headers[Math.floor(Math.random() * headers.length)],
	);

	const [isHolding, setIsHolding] = useState(false);
	const [holdProgress, setHoldProgress] = useState(0);
	const [showTooltip, setShowTooltip] = useState(false);
	const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);

	const handleLogout = async () => {
		await logoutMutation.mutateAsync();
		navigate({ to: "/" });
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
				if (progressIntervalRef.current)
					clearInterval(progressIntervalRef.current);
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
							to="/create-account"
							className="w-full px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center"
						>
							Create Account
						</Link>
						<Link
							to="/sign-in"
							className="w-full px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl border border-neutral-700 transition-colors text-sm flex items-center justify-center"
						>
							Sign In
						</Link>
					</div>
				) : (
					<div className="flex flex-col h-full">
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
							<a
								href="/"
								className="flex items-center gap-4 px-3 py-3 text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-xl transition-all group outline-none"
							>
								<Star className="w-5 h-5" fill="none" />
								<span className="font-medium">Ratings</span>
							</a>
							<a
								href="/"
								className="flex items-center gap-4 px-3 py-3 text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-xl transition-all group outline-none"
							>
								<Bell className="w-5 h-5" fill="none" />
								<span className="font-medium">Activity</span>
							</a>
							<a
								href="/"
								className="flex items-center gap-4 px-3 py-3 text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-xl transition-all group outline-none"
							>
								<Settings className="w-5 h-5" fill="none" />
								<span className="font-medium">Settings</span>
							</a>
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
				<nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-neutral-950/80 backdrop-blur-md border-t border-neutral-800 px-6 py-3 flex justify-between items-center z-50">
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
					<a
						href="/"
						className="flex flex-col items-center gap-1 text-neutral-400 hover:text-white transition-colors"
					>
						<Star className="w-6 h-6" fill="none" />
						<span className="text-[10px] font-medium">Ratings</span>
					</a>
					<a
						href="/"
						className="flex flex-col items-center gap-1 text-neutral-400 hover:text-white transition-colors"
					>
						<Bell className="w-6 h-6" fill="none" />
						<span className="text-[10px] font-medium">Activity</span>
					</a>
					<a
						href="/"
						className="flex flex-col items-center gap-1 text-neutral-400 hover:text-white transition-colors"
					>
						<Settings className="w-6 h-6" fill="none" />
						<span className="text-[10px] font-medium">Settings</span>
					</a>
				</nav>
			)}
		</>
	);
}
