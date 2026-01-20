import { Link } from "@tanstack/react-router";
import { useMemo, useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import {
	useRecentTags,
	useRecentStuff,
} from "~/features/display-ratings/queries";
import type { PublicUser } from "~/features/auth/types";
import { AuthModal } from "~/features/auth/components/auth-modal";

export function DiscoverStrip({ user }: { user?: PublicUser }) {
	const isAuthenticated = user != null;
	const { data: recentStuff, isLoading: loadingStuff } =
		useRecentStuff(isAuthenticated);
	const { data: recentTags, isLoading: loadingTags } =
		useRecentTags(isAuthenticated);

	const skeletonStuffKeys = useMemo(
		() => Array.from({ length: 4 }, (_, i) => `s_${i}`),
		[],
	);
	const skeletonTagWidths = useMemo(() => {
		const widths = ["w-8", "w-10", "w-12", "w-16", "w-20"];
		return Array.from({ length: 6 }, (_, i) => widths[i % widths.length]);
	}, []);

	const [isRoot, setIsRoot] = useState(false);
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;
		setIsRoot(window.location.pathname === "/");
	}, []);

	if (!isRoot) return null;

	return (
		<div className="w-full block lg:hidden border-neutral-800 md:border-l md:border-r">
			{/* Single horizontal line with stuff items followed by tags */}
			<div
				className="overflow-x-auto hide-scrollbar whitespace-nowrap flex items-center gap-2 px-4 py-3"
				style={{
					maskImage: "linear-gradient(to right, black 80%, transparent 100%)",
					WebkitMaskImage:
						"linear-gradient(to right, black 80%, transparent 100%)",
				}}
			>
				{loadingStuff || loadingTags ? (
					<>
						{/* Merged loading state for a smoother feel */}
						{skeletonStuffKeys.map((sKey) => (
							<div
								key={sKey}
								className="inline-flex items-center bg-neutral-800/40 rounded-md animate-pulse"
							>
								<div className="h-6 w-24" />
							</div>
						))}
						{skeletonTagWidths.map((w, i) => (
							<div
								key={`t_${
									// biome-ignore lint/suspicious/noArrayIndexKey: safe
									i
								}`}
								className={`inline-flex items-center h-6 ${w} bg-neutral-800/40 rounded-md animate-pulse`}
							/>
						))}
					</>
				) : (
					<>
						{(recentStuff ?? []).map((stuff) => (
							<Link
								key={stuff.id}
								to="/stuff/$stuffSlug"
								params={{ stuffSlug: stuff.slug }}
								className="inline-flex items-center py-0.5 pl-0.5 pr-2 bg-neutral-800 text-white text-sm font-medium rounded-md"
							>
								{/* small thumbnail/icon to differentiate stuff */}
								<div className="flex items-center mr-0.5">
									<div className="w-5 h-5 bg-neutral-800 rounded-sm shrink-0 flex items-center justify-center">
										<TrendingUp
											className="w-4 h-4 text-neutral-300"
											aria-hidden
										/>
									</div>
								</div>
								{stuff.name}
							</Link>
						))}

						{(recentTags ?? []).map((tag) =>
							isAuthenticated ? (
								<Link
									key={tag.name}
									to="/"
									search={{ tag: tag.name }}
									className="inline-flex items-center px-1.5 py-0.5 bg-neutral-800/70 text-neutral-400 hover:text-neutral-300 text-sm font-medium transition-colors rounded-md"
								>
									#{tag.name}
								</Link>
							) : (
								<button
									key={tag.name}
									type="button"
									onClick={() => setIsAuthModalOpen(true)}
									className="inline-flex items-center px-1.5 py-0.5 bg-neutral-800/70 text-neutral-400 hover:text-neutral-300 text-sm font-medium transition-colors rounded-md cursor-pointer"
								>
									#{tag.name}
								</button>
							),
						)}
					</>
				)}
			</div>

			{/* Divider matching the app's section dividers */}
			<div className="border-t border-neutral-800" />

			{/* Auth Modal */}
			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
			/>
		</div>
	);
}
