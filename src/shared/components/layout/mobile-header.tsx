import AppLogo from "~/shared/components/ui/app-logo";
import { Link } from "@tanstack/react-router";
import { useAuth } from "~/features/auth/hooks";
import { m } from "~/paraglide/messages";

export function MobileHeader() {
	const { data: user } = useAuth();
	if (user != null) return null;

	return (
		<div
			className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/8 overflow-hidden"
			style={{
				backgroundColor: "rgba(10, 10, 13, 0.78)",
				backdropFilter: "blur(24px) saturate(180%)",
				WebkitBackdropFilter: "blur(24px) saturate(180%)",
				paddingBottom: "env(safe-area-inset-bottom, 0)",
			}}
		>
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
					opacity: 0.07,
					mixBlendMode: "overlay",
				}}
			/>
			<div className="w-full max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<AppLogo size={30} />
				</div>

				<div className="flex items-center gap-2">
					<Link
						to="/sign-up"
						className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors text-base flex items-center justify-center"
					>
						{m.nav_create_account()}
					</Link>
					<Link
						to="/sign-in"
						search={{ redirect: undefined }}
						className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl border border-neutral-700 transition-colors text-base flex items-center justify-center"
					>
						{m.nav_sign_in()}
					</Link>
				</div>
			</div>
		</div>
	);
}
