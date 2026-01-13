import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Footer } from "~/components/layout/footer";
import { useMemo } from "react";
import { randomSuffix } from "~/lib/utils/strings";
import {
	useRecentTags,
	useRecentStuff,
} from "~/features/display-ratings/queries";

export function RightSidebar({ user }: { user?: { username: string } }) {
	const isAuthenticated = user != null;
	const { data: recentStuff, isLoading: loadingStuff } =
		useRecentStuff(isAuthenticated);
	const { data: recentTags, isLoading: loadingTags } =
		useRecentTags(isAuthenticated);

	const skeletonStuffKeys = useMemo(
		() => Array.from({ length: 5 }, (_) => `s_${randomSuffix()}`),
		[],
	);
	const skeletonTagKeys = useMemo(
		() => Array.from({ length: 6 }, (_) => `t_${randomSuffix()}`),
		[],
	);

	return (
		<aside className="w-80 px-4 py-6 hidden lg:block sticky top-0 h-screen overflow-y-auto">
			<div className="space-y-4">
				{isAuthenticated && (
					<>
						{/* Recently Rated */}
						<section>
							<div className="flex items-center justify-between mb-2 px-1">
								<p className="text-md font-semibold text-white">
									Recently Rated
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
												<div className="w-9 h-9 bg-neutral-800 rounded-md" />
												<div className="flex-1 min-w-0">
													<div className="h-3 bg-neutral-800 rounded w-3/4 mb-2" />
													<div className="h-2 bg-neutral-800 rounded w-1/2" />
												</div>
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
													<ChevronRight className="w-4 h-4" />
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
									? skeletonTagKeys.map((sKey) => (
											<div
												key={sKey}
												className="inline-flex items-center px-1.5 py-0.5 bg-neutral-800/70 text-neutral-400 text-sm font-medium rounded-md"
											>
												<div className="h-4 bg-neutral-800 rounded w-12" />
											</div>
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
