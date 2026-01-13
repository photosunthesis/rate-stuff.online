import { useState } from "react";
import { Link } from "@tanstack/react-router";
import AppLogo from "~/components/ui/app-logo";

const headers = [
	"Rate literally anything.",
	"Score everything, regret nothing.",
	"Rate reality, one to ten.",
	"Everything gets a score.",
	"The world, out of ten.",
	"Rate the whole universe.",
	"Your opinion, now numbered.",
];

export function MobileHeader({ user }: { user?: { username: string } }) {
	const isAuthenticated = user != null;
	const [header] = useState(
		() => headers[Math.floor(Math.random() * headers.length)],
	);

	if (isAuthenticated) {
		return null;
	}

	return (
		<div className="lg:hidden w-full flex justify-center bg-neutral-950/50 backdrop-blur-sm">
			<div className="w-full max-w-2xl border border-neutral-800 px-4 py-4">
				<div className="flex items-center gap-3 mb-1">
					<AppLogo size={30} />
				</div>
				<h1
					className="text-lg font-semibold text-white mb-2"
					suppressHydrationWarning
				>
					{header}
				</h1>
				<div className="gap-2 flex">
					<Link
						to="/create-account"
						className="flex-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center"
					>
						Create Account
					</Link>
					<Link
						to="/sign-in"
						search={{ redirect: undefined }}
						className="flex-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl border border-neutral-700 transition-colors text-sm flex items-center justify-center"
					>
						Sign In
					</Link>
				</div>
			</div>
		</div>
	);
}
