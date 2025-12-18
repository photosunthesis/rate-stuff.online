import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import AppLogo from "../ui/app-logo";
import { useIsAuthenticated, useLogoutMutation } from "~/features/auth/queries";
import { Home, Star, User, Settings, LogOut } from "lucide-react";

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

	const handleLogout = async () => {
		await logoutMutation.mutateAsync();
		navigate({ to: "/" });
	};

	return (
		<>
			<aside className="w-64 px-4 py-6 hidden lg:flex flex-col sticky top-0 h-screen">
				<div className="flex flex-col gap-2 mb-4">
					<AppLogo size={40} />
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
								className="flex items-center gap-4 px-3 py-3 text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-xl transition-all group"
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
								to="/ratings"
								className="flex items-center gap-4 px-3 py-3 text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-xl transition-all group"
								activeProps={{ className: "text-white bg-neutral-800/80" }}
							>
								{({ isActive }) => (
									<>
										<Star
											className="w-5 h-5"
											fill={isActive ? "currentColor" : "none"}
										/>
										<span className="font-medium">Ratings</span>
									</>
								)}
							</Link>
							<Link
								to="/profile"
								className="flex items-center gap-4 px-3 py-3 text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-xl transition-all group"
								activeProps={{ className: "text-white bg-neutral-800/80" }}
							>
								{({ isActive }) => (
									<>
										<User
											className="w-5 h-5"
											fill={isActive ? "currentColor" : "none"}
										/>
										<span className="font-medium">Profile</span>
									</>
								)}
							</Link>
							<Link
								to="/settings"
								className="flex items-center gap-4 px-3 py-3 text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-xl transition-all group"
								activeProps={{ className: "text-white bg-neutral-800/80" }}
							>
								{({ isActive }) => (
									<>
										<Settings
											className="w-5 h-5"
											fill={isActive ? "currentColor" : "none"}
										/>
										<span className="font-medium">Settings</span>
									</>
								)}
							</Link>
						</nav>

						<div className="mt-auto">
							<button
								type="button"
								onClick={handleLogout}
								className="w-full flex items-center gap-4 px-3 py-3 text-neutral-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all group cursor-pointer"
							>
								<LogOut className="w-5 h-5" />
								<span className="font-medium">Logout</span>
							</button>
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
					<Link
						to="/ratings"
						className="flex flex-col items-center gap-1 text-neutral-400 hover:text-white transition-colors"
						activeProps={{ className: "text-white" }}
					>
						{({ isActive }) => (
							<>
								<Star
									className="w-6 h-6"
									fill={isActive ? "currentColor" : "none"}
								/>
								<span className="text-[10px] font-medium">Ratings</span>
							</>
						)}
					</Link>
					<Link
						to="/profile"
						className="flex flex-col items-center gap-1 text-neutral-400 hover:text-white transition-colors"
						activeProps={{ className: "text-white" }}
					>
						{({ isActive }) => (
							<>
								<User
									className="w-6 h-6"
									fill={isActive ? "currentColor" : "none"}
								/>
								<span className="text-[10px] font-medium">Profile</span>
							</>
						)}
					</Link>
					<Link
						to="/settings"
						className="flex flex-col items-center gap-1 text-neutral-400 hover:text-white transition-colors"
						activeProps={{ className: "text-white" }}
					>
						{({ isActive }) => (
							<>
								<Settings
									className="w-6 h-6"
									fill={isActive ? "currentColor" : "none"}
								/>
								<span className="text-[10px] font-medium">Settings</span>
							</>
						)}
					</Link>
				</nav>
			)}
		</>
	);
}
