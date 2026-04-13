import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import AppLogo from "~/components/ui/misc/app-logo";
import { Home, Bell, Menu, LogOut, Plus } from "lucide-react";
import { CreateRatingModal } from "~/domains/ratings/components/create-rating-modal";
import { ConfirmModal } from "~/components/ui/modal/confirm-modal";
import { useSignOut } from "~/domains/users/hooks";
import { unreadActivityCountQueryOptions } from "~/domains/activity/queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useUmami } from "@danielgtmn/umami-react";
import { useAuth } from "~/domains/users/queries";

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

export function LeftSidebar() {
	const { data: user } = useAuth();
	const umami = useUmami();
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isSignOutOpen, setIsSignOutOpen] = useState(false);
	const isAuthenticated = user != null;
	const [header] = useState(() => getHeader());
	const location = useLocation();
	const [signOut] = useSignOut();
	const showFloatingButton = location.pathname === "/";
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
								onClick={() => {
									if (umami) umami.track("click_nav", { destination: "home" });
								}}
							>
								<Home className="w-5 h-5" />
								<span className="font-medium">Home</span>
							</Link>

							<Link
								to="/activity"
								className="flex items-center gap-4 px-3 py-2 text-neutral-500 hover:text-white hover:bg-neutral-800/50 rounded-xl transition-all group outline-none"
								activeProps={{ className: "text-white font-bold" }}
								onClick={() => {
									if (umami)
										umami.track("click_nav", { destination: "activity" });
								}}
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
								to="/menu"
								className="flex items-center gap-4 px-3 py-2 text-neutral-500 hover:text-white hover:bg-neutral-800/50 rounded-xl transition-all group outline-none"
								activeProps={{ className: "bg-neutral-800/50 text-white" }}
								onClick={() => {
									if (umami) umami.track("click_nav", { destination: "menu" });
								}}
							>
								<Menu className="w-5 h-5" />
								<span className="font-medium">Menu</span>
							</Link>
						</nav>

						<div className="my-6 px-3">
							<button
								type="button"
								onClick={() => {
									if (umami) umami.track("click_create_rating");
									setIsCreateOpen(true);
								}}
								className="w-full p-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors text-base flex items-center justify-center gap-2 cursor-pointer"
							>
								<Plus className="w-5 h-5 shrink-0" />
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
							onClick={() => {
								if (umami) umami.track("click_nav", { destination: "home" });
							}}
						>
							<Home className="w-6 h-6" />
						</Link>

						<Link
							to="/activity"
							title="Activity"
							className="p-2 text-neutral-500 hover:text-white rounded-lg transition-colors"
							activeProps={{ className: "text-white" }}
							onClick={() => {
								if (umami)
									umami.track("click_nav", { destination: "activity" });
							}}
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
							to="/menu"
							title="Menu"
							className="p-2 text-neutral-500 hover:text-white rounded-lg transition-colors"
							onClick={() => {
								if (umami) umami.track("click_nav", { destination: "menu" });
							}}
						>
							<Menu className="w-6 h-6" />
						</Link>
					</div>

					<div className="mb-4">
						<button
							type="button"
							onClick={() => {
								if (umami) umami.track("click_create_rating");
								setIsCreateOpen(true);
							}}
							aria-label="New Rating"
							title="New Rating"
							className="bg-emerald-500 hover:bg-emerald-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow"
						>
							<Plus className="w-5 h-5" />
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
				<div
					className="md:hidden fixed left-0 right-0 flex items-center justify-center gap-3 z-50 pointer-events-none"
					style={{ bottom: "max(0.375rem, env(safe-area-inset-bottom, 0.375rem))" }}
				>
					<div className="flex items-center gap-2.5 pointer-events-auto">
						{/* Liquid glass pill */}
						<nav
							className="relative flex items-center gap-0.5 px-1.5 py-1 h-14 rounded-full"
							style={{
								background: "rgba(22, 22, 26, 0.72)",
								backdropFilter: "blur(28px) saturate(200%)",
								WebkitBackdropFilter: "blur(28px) saturate(200%)",
								border: "1px solid rgba(255,255,255,0.05)",
								boxShadow:
									"inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.15)",
							}}
						>
							<Link
								to="/"
								activeOptions={{ exact: true }}
								className="flex flex-col items-center justify-center gap-0.5 w-[4.5rem] h-12 px-2 rounded-full text-neutral-400 hover:text-white transition-all duration-200 outline-none"
								activeProps={{
									className: "text-white",
									style: { background: "rgba(255,255,255,0.10)" },
								}}
								onClick={() => {
									if (umami) umami.track("click_nav", { destination: "home" });
								}}
							>
								<Home className="w-[22px] h-[22px] mt-0.5" />
								<span className="text-[10px] font-medium tracking-wide">Home</span>
							</Link>

							<Link
								to="/activity"
								className="flex flex-col items-center justify-center gap-0.5 w-[4.5rem] h-12 px-2 rounded-full text-neutral-400 hover:text-white transition-all duration-200 outline-none"
								activeProps={{
									className: "text-white",
									style: { background: "rgba(255,255,255,0.10)" },
								}}
								onClick={() => {
									if (umami) umami.track("click_nav", { destination: "activity" });
								}}
							>
								<div className="relative mt-0.5">
									<Bell className="w-[22px] h-[22px]" />
									{unreadCount > 0 && (
										<span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
											<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
											<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
										</span>
									)}
								</div>
								<span className="text-[10px] font-medium tracking-wide">Activity</span>
							</Link>

							<Link
								to="/menu"
								className="flex flex-col items-center justify-center gap-0.5 w-[4.5rem] h-12 px-2 rounded-full text-neutral-400 hover:text-white transition-all duration-200 outline-none"
								activeProps={{
									className: "text-white",
									style: { background: "rgba(255,255,255,0.10)" },
								}}
								onClick={() => {
									if (umami) umami.track("click_nav", { destination: "menu" });
								}}
							>
								<Menu className="w-[22px] h-[22px] mt-0.5" />
								<span className="text-[10px] font-medium tracking-wide">Menu</span>
							</Link>
						</nav>

						{/* Green FAB — right side for thumb reach */}
						<button
							type="button"
							onClick={() => {
								if (umami) umami.track("click_create_rating");
								setIsCreateOpen(true);
							}}
							aria-label="New Rating"
							className="w-14 h-14 rounded-full text-white flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shrink-0"
							style={{
								background: "linear-gradient(145deg, #34d399 0%, #059669 100%)",
								boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28)",
							}}
						>
							<Plus className="w-5 h-5" />
						</button>
					</div>
				</div>
			)}
		</>
	);
}
