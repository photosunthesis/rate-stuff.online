import { useState } from "react";
import { Link } from "@tanstack/react-router";
import AppLogo from "../ui/app-logo";

interface SidebarProps {
	isAuthenticated?: boolean;
}

const headers = [
	"Rate whole universe.",
	"Score everything, regret nothing.",
	"Judge reality, 1–10.",
	"Grade the cosmic soup.",
	"Everything gets a score.",
	"Rate the invisible bits.",
	"Your opinion, now numbered.",
	"The world, out of ten.",
];

export function Sidebar({ isAuthenticated = false }: SidebarProps) {
	const [header] = useState(
		() => headers[Math.floor(Math.random() * headers.length)],
	);

	return (
		<aside className="w-64 px-4 py-6 hidden lg:block sticky top-0 h-screen">
			{/* Logo/Branding */}
			<div className="flex flex-col gap-2 mb-4">
				<AppLogo size={40} />
				<h1
					className="text-2xl font-semibold text-white"
					suppressHydrationWarning
				>
					{header}
				</h1>
			</div>

			{/* Navigation or Auth Buttons */}
			{!isAuthenticated && (
				<div className="space-y-2">
					<Link
						to="/create-account"
						className="w-full px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded transition-colors text-sm flex items-center justify-center"
					>
						Create Account
					</Link>
					<Link
						to="/sign-in"
						className="w-full px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded border border-neutral-700 transition-colors text-sm flex items-center justify-center"
					>
						Sign In
					</Link>
				</div>
			)}

			{isAuthenticated && (
				<nav className="space-y-4">
					<a
						href="/"
						className="flex items-center gap-4 text-white text-base hover:text-emerald-400 transition-colors group"
					>
						<div className="w-6 h-6 group-hover:bg-emerald-400/20" />
						<span>Home</span>
					</a>
					<a
						href="/explore"
						className="flex items-center gap-4 text-white text-base hover:text-emerald-400 transition-colors group"
					>
						<div className="w-6 h-6 group-hover:bg-emerald-400/20" />
						<span>Explore</span>
					</a>
					<a
						href="/profile"
						className="flex items-center gap-4 text-white text-base hover:text-emerald-400 transition-colors group"
					>
						<div className="w-6 h-6 group-hover:bg-emerald-400/20" />
						<span>Profile</span>
					</a>
				</nav>
			)}
		</aside>
	);
}
