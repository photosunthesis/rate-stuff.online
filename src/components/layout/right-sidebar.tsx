import { Link } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";
import { Footer } from "~/components/layout/footer";
import { useMemo } from "react";
import { randomSuffix } from "~/lib/utils/strings";
import {
	useRecentTags,
	useRecentStuff,
} from "~/lib/features/display-ratings/queries";
import type { PublicUser } from "~/lib/features/auth/types";

export function RightSidebar({ user }: { user?: PublicUser }) {
	const isAuthenticated = user != null;
	const { data: recentStuff, isLoading: loadingStuff } =
		useRecentStuff(isAuthenticated);
	const { data: recentTags, isLoading: loadingTags } =
		useRecentTags(isAuthenticated);

	const skeletonStuffKeys = useMemo(
		() => Array.from({ length: 5 }, (_) => `s_${randomSuffix()}`),
		[],
	);
	const skeletonTagWidths = useMemo(() => {
		const widths = ["w-8", "w-10", "w-12", "w-16", "w-20"];
		return Array.from(
			{ length: 6 },
			() => widths[Math.floor(Math.random() * widths.length)],
		);
	}, []);

	return (
		<aside className="w-80 px-4 py-6 hidden lg:block sticky top-0 h-screen overflow-y-auto">
			<div className="space-y-4">
				{isAuthenticated && (
					<>
						{/* Recent Ratings */}
						<section>
							<div className="flex items-center justify-between mb-2 px-1">
								<p className="text-md font-semibold text-white">
									Recent Ratings
								</p>
							</div>

							<div className="bg-neutral-800/30 rounded-xl border border-neutral-800/50 overflow-hidden">
								{loadingStuff
									? skeletonStuffKeys.map((sKey, i) => (
											<div
												key={sKey}
												className={`flex items-center gap-3 px-4 py-3 ${
													i !== skeletonStuffKeys.length - 1
														? "border-b border-neutral-800/50"
														: ""
												}`}
											>
												<div className="flex-1 min-w-0">
													<div className="h-3 bg-neutral-800 rounded w-3/4" />
												</div>
												<div className="w-4 h-4 bg-neutral-800 rounded" />
											</div>
										))
									: (recentStuff ?? []).map((thing, i) => (
											<Link
												key={thing.id}
												to="/stuff/$stuffSlug"
												params={{ stuffSlug: thing.slug }}
												className={`flex items-center gap-3 px-4 py-3 hover:bg-neutral-800/40 transition-colors ${
													i !== (recentStuff ?? []).length - 1
														? "border-b border-neutral-800/50"
														: ""
												}`}
											>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium text-white truncate">
														{thing.name}
													</p>
												</div>

												<div className="text-neutral-500">
													<TrendingUp
														className="w-4 h-4 text-neutral-400"
														aria-hidden
													/>
												</div>
											</Link>
										))}
							</div>
						</section>

						{/* Recent Tags */}
						<section>
							<p className="text-md font-semibold text-white mb-2 px-1">
								Popular Tags
							</p>
							<div className="flex flex-wrap gap-1.5 px-1">
								{loadingTags
									? skeletonTagWidths.map((w, i) => (
											<div
												key={`${w}-${
													// biome-ignore lint/suspicious/noArrayIndexKey: safe to use index here
													i
												}`}
												className={`inline-flex items-center px-1.5 py-0.5 h-6 ${w} bg-neutral-800/70 rounded-md`}
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
						</section>
					</>
				)}

				{/* Footer Links */}
				<Footer />
			</div>
		</aside>
	);
}
