import { Link } from "@tanstack/react-router";
import { useMemo, useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import {
	useRecentTags,
	useRecentStuff,
} from "~/features/display-ratings/queries";
import type { PublicUser } from "~/features/auth/types";

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

	useEffect(() => {
		if (typeof window === "undefined") return;
		setIsRoot(window.location.pathname === "/");
	}, []);

	if (!isAuthenticated || !isRoot) return null;

	return (
		<div className="w-full block lg:hidden">
			{/* Single horizontal line with stuff items followed by tags */}
			<div className="overflow-x-auto hide-scrollbar whitespace-nowrap flex items-center gap-2 px-4 py-3">
				{loadingStuff
					? skeletonStuffKeys.map((sKey) => (
							<div
								key={sKey}
								className="inline-flex items-center px-1.5 py-0.5 bg-neutral-800 text-white text-sm font-medium rounded-md"
							>
								<div className="h-3 bg-neutral-800 rounded w-16" />
							</div>
						))
					: (recentStuff ?? []).map((thing) => (
							<Link
								key={thing.id}
								to="/stuff/$stuffSlug"
								params={{ stuffSlug: thing.slug }}
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
								{thing.name}
							</Link>
						))}

				{loadingTags
					? skeletonTagWidths.map((w, i) => (
							<div
								key={`${w}-${
									// biome-ignore lint/suspicious/noArrayIndexKey: safe to use index here
									i
								}`}
								className={`inline-flex items-center px-1.5 py-0.5 h-6 ${w} bg-neutral-800/70 rounded`}
							/>
						))
					: (recentTags ?? []).map((tag) => (
							<Link
								key={tag.name}
								to="/"
								search={{ tag: tag.name }}
								className="inline-flex items-center px-1.5 py-0.5 bg-neutral-800/70 text-neutral-400 hover:text-neutral-300 text-sm font-medium transition-colors rounded-md"
							>
								#{tag.name}
							</Link>
						))}
			</div>

			{/* Divider matching the app's section dividers */}
			<div className="border-t border-neutral-800" />
		</div>
	);
}
