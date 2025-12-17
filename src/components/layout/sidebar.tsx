import { Link } from "@tanstack/react-router";
import AppLogo from "../ui/appLogo";

interface SidebarProps {
	isAuthenticated?: boolean;
}

export function Sidebar({ isAuthenticated = false }: SidebarProps) {
	return (
		<aside className="w-64 border-r border-neutral-800 px-4 py-6 hidden lg:block sticky top-0 h-screen">
			{/* Logo/Branding */}
			<div className="flex flex-col gap-2 mb-4">
				<h1 className="flex items-center gap-2 text-xl font-black text-white">
					Rate Stuff Online
					<AppLogo />
				</h1>
				<span className="text-sm text-neutral-400">
					Rate stuff—concrete or abstract—on a scale of 1 to 10.
				</span>
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
