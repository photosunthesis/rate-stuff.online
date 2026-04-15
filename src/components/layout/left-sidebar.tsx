import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { m } from "~/paraglide/messages";
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
		m.sidebar_tagline_0(),
		m.sidebar_tagline_1(),
		m.sidebar_tagline_2(),
		m.sidebar_tagline_3(),
		m.sidebar_tagline_4(),
		m.sidebar_tagline_5(),
		m.sidebar_tagline_6(),
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

	const [signOut] = useSignOut();

	const [navVisible, setNavVisible] = useState(true);
	const lastScrollY = useRef(0);

	useEffect(() => {
		const onScroll = () => {
			const y = window.scrollY;
			setNavVisible(y < lastScrollY.current || y < 50);
			lastScrollY.current = y;
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

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
						title={m.sign_out_modal_title()}
						description={m.sign_out_modal_description()}
						confirmLabel={m.sign_out_modal_confirm()}
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
							{m.nav_create_account()}
						</Link>
						<Link
							to="/sign-in"
							search={{ redirect: undefined }}
							className="w-full px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl border border-neutral-700 transition-colors text-base flex items-center justify-center"
						>
							{m.nav_sign_in()}
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
								<Home className="w-6 h-6" />
								<span className="font-medium">{m.nav_home()}</span>
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
									<Bell className="w-6 h-6" />
									{unreadCount > 0 && (
										<span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
											<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
											<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
										</span>
									)}
								</div>
								<span className="font-medium">{m.nav_activity()}</span>
							</Link>
							<Link
								to="/menu"
								className="flex items-center gap-4 px-3 py-2 text-neutral-500 hover:text-white hover:bg-neutral-800/50 rounded-xl transition-all group outline-none"
								activeProps={{ className: "bg-neutral-800/50 text-white" }}
								onClick={() => {
									if (umami) umami.track("click_nav", { destination: "menu" });
								}}
							>
								<Menu className="w-6 h-6" />
								<span className="font-medium">{m.nav_menu()}</span>
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
								<span className="truncate">{m.nav_new_rating()}</span>
							</button>
						</div>

						<div className="mt-auto">
							<button
								type="button"
								onClick={() => setIsSignOutOpen(true)}
								className="w-full flex items-center gap-4 px-3 py-2 text-neutral-500 hover:text-red-400 hover:bg-neutral-800/50 rounded-xl transition-all group cursor-pointer outline-none"
							>
								<LogOut className="w-6 h-6" />
								<span className="font-medium">{m.nav_sign_out()}</span>
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
							title={m.nav_home()}
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
							title={m.nav_activity()}
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
							title={m.nav_menu()}
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
							aria-label={m.nav_new_rating()}
							title={m.nav_new_rating()}
							className="bg-emerald-500 hover:bg-emerald-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow"
						>
							<Plus className="w-6 h-6" />
						</button>
					</div>

					<button
						type="button"
						onClick={() => setIsSignOutOpen(true)}
						className="mb-6 p-2 text-neutral-500 hover:text-red-400 rounded-lg transition-colors"
					>
						<LogOut className="w-6 h-6" />
					</button>
				</aside>
			)}

			{/* FAB + bottom bar — FAB stays visible, bar slides away on scroll */}
			{isAuthenticated && (
				<div
					className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex flex-col pointer-events-none transition-transform duration-300 ease-in-out"
					style={{
						transform: navVisible
							? "translateY(0)"
							: "translateY(calc(4rem + env(safe-area-inset-bottom, 0px)))",
					}}
				>
					{/* FAB */}
					<div className="flex justify-end pr-4 pb-2 pointer-events-none">
						<button
							type="button"
							onClick={() => {
								if (umami) umami.track("click_create_rating");
								setIsCreateOpen(true);
							}}
							className="flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm active:scale-95 cursor-pointer pointer-events-auto transition-all"
						>
							<Plus className="w-4 h-4 shrink-0" />
							{m.nav_new_rating()}
						</button>
					</div>

					<nav
						className="relative flex items-center justify-center gap-6 border-t border-white/8 overflow-hidden pointer-events-auto"
						style={{
							backgroundColor: "rgba(10, 10, 13, 0.78)",
							backdropFilter: "blur(24px) saturate(180%)",
							WebkitBackdropFilter: "blur(24px) saturate(180%)",
							paddingBottom: "env(safe-area-inset-bottom, 0)",
						}}
					>
						{/* Grain overlay */}
						<div
							className="absolute inset-0 pointer-events-none"
							style={{
								backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
								opacity: 0.07,
								mixBlendMode: "overlay",
							}}
						/>
						<Link
							to="/"
							activeOptions={{ exact: true }}
							className="flex flex-col items-center justify-center gap-0.5 w-24 h-16 text-neutral-500 hover:text-white transition-colors outline-none"
							activeProps={{ className: "text-white" }}
							onClick={() => {
								if (umami) umami.track("click_nav", { destination: "home" });
							}}
						>
							<Home className="w-6 h-6" />
							<span className="text-xs font-medium">{m.nav_home()}</span>
						</Link>

						<Link
							to="/activity"
							className="flex flex-col items-center justify-center gap-0.5 w-24 h-16 text-neutral-500 hover:text-white transition-colors outline-none"
							activeProps={{ className: "text-white" }}
							onClick={() => {
								if (umami) umami.track("click_nav", { destination: "activity" });
							}}
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
							<span className="text-xs font-medium">{m.nav_activity()}</span>
						</Link>

						<Link
							to="/menu"
							className="flex flex-col items-center justify-center gap-0.5 w-24 h-16 text-neutral-500 hover:text-white transition-colors outline-none"
							activeProps={{ className: "text-white" }}
							onClick={() => {
								if (umami) umami.track("click_nav", { destination: "menu" });
							}}
						>
							<Menu className="w-6 h-6" />
							<span className="text-xs font-medium">{m.nav_menu()}</span>
						</Link>
					</nav>
				</div>
			)}
		</>
	);
}
