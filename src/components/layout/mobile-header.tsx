import AppLogo from "~/components/ui/app-logo";
import { Link } from "@tanstack/react-router";
import type { PublicUser } from "~/features/auth/types";

export function MobileHeader({ user }: { user?: PublicUser }) {
	if (user != null) return null;

	return (
		<div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-lg border-t border-white/5">
			<div className="absolute inset-0 bg-linear-to-t from-neutral-950/95 via-neutral-950/60 to-neutral-950/10 -z-10" />
			<div className="w-full max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<AppLogo size={30} />
				</div>

				<div className="flex items-center gap-2">
					<Link
						to="/sign-up"
						className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors text-base flex items-center justify-center"
					>
						Create Account
					</Link>
					<Link
						to="/sign-in"
						search={{ redirect: undefined }}
						className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl border border-neutral-700 transition-colors text-base flex items-center justify-center"
					>
						Sign In
					</Link>
				</div>
			</div>
		</div>
	);
}
