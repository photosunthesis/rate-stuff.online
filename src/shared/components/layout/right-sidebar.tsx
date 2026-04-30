import { Link } from "@tanstack/react-router";
import { m } from "~/paraglide/messages";
import { TrendingUp } from "lucide-react";
import { Footer } from "~/shared/components/layout/footer";
import { useMemo } from "react";
import {
	useRecentTags,
	useRecentStuff,
} from "~/features/ratings/hooks/display";
import { useAuth } from "~/features/auth/hooks";
import { useAuthModal } from "~/features/auth/components/auth-modal-provider";
import { useSkeletonFade } from "~/shared/hooks/use-skeleton-fade";

export function RightSidebar() {
	const { data: user } = useAuth();
	const isAuthenticated = user != null;
	const { data: recentStuff, isLoading: loadingStuff } =
		useRecentStuff(isAuthenticated);
	const { data: recentTags, isLoading: loadingTags } =
		useRecentTags(isAuthenticated);

	const skeletonStuffKeys = useMemo(
		() => Array.from({ length: 5 }, (_, i) => `s_${i}`),
		[],
	);
	const skeletonTagWidths = useMemo(() => {
		const widths = ["w-8", "w-10", "w-12", "w-16", "w-20"];
		return Array.from({ length: 6 }, (_, i) => widths[i % widths.length]);
	}, []);

	const { openAuthModal } = useAuthModal();
	const stuffFade = useSkeletonFade(loadingStuff);
	const tagsFade = useSkeletonFade(loadingTags);

	return (
		<aside className="w-80 px-4 py-6 hidden lg:block sticky top-0 h-screen overflow-y-auto">
			<div className="space-y-4">
				{isAuthenticated && (
					<>
						<section>
							<div className="flex items-center justify-between mb-2 px-1">
								<p className="text-md font-semibold text-white">
									{m.right_sidebar_recent_ratings()}
								</p>
							</div>

							<div className="bg-neutral-800/30 rounded-2xl border border-neutral-800/50 overflow-hidden">
								{stuffFade.showSkeleton ? (
									<div className={stuffFade.skeletonClass}>
										{skeletonStuffKeys.map((sKey, i) => (
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
										))}
									</div>
								) : (
									<div
										key={stuffFade.contentKey}
										className="animate-skeleton-reveal"
									>
										{(recentStuff ?? []).map((thing, i) => (
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
													<p className="text-base font-medium text-white truncate">
														{thing.name}
													</p>
												</div>

												<div className="text-neutral-400">
													<TrendingUp
														className="w-4 h-4 text-neutral-300"
														aria-hidden
													/>
												</div>
											</Link>
										))}
									</div>
								)}
							</div>
						</section>

						<section>
							<p className="text-md font-semibold text-white mb-2 px-1">
								{m.right_sidebar_trending_tags()}
							</p>
							<div className="flex flex-wrap gap-1.5 px-1">
								{tagsFade.showSkeleton ? (
									<div
										className={`flex flex-wrap gap-1.5 ${tagsFade.skeletonClass}`}
									>
										{skeletonTagWidths.map((w, i) => (
											<div
												key={`${w}-${
													// biome-ignore lint/suspicious/noArrayIndexKey: safe to use index here
													i
												}`}
												className={`inline-flex items-center px-1.5 py-0.5 h-6 ${w} bg-neutral-800/70 rounded-full`}
											/>
										))}
									</div>
								) : (
									<div
										key={tagsFade.contentKey}
										className="flex flex-wrap gap-1.5 animate-skeleton-reveal"
									>
										{(recentTags ?? []).map((tag) =>
											isAuthenticated ? (
												<Link
													key={tag.name}
													to="/"
													search={{ tag: tag.name }}
													className="inline-flex items-center pl-1.5 pr-2 py-0.5 bg-neutral-800/70 text-neutral-300 hover:text-neutral-300 text-sm font-medium transition-colors rounded-full"
												>
													#{tag.name}
												</Link>
											) : (
												<button
													key={tag.name}
													type="button"
													onClick={() => openAuthModal()}
													className="inline-flex items-center pl-1.5 pr-2 py-0.5 bg-neutral-800/70 text-neutral-300 hover:text-neutral-300 text-sm font-medium transition-colors rounded-full cursor-pointer"
												>
													#{tag.name}
												</button>
											),
										)}
									</div>
								)}
							</div>
						</section>
					</>
				)}

				<Footer />
			</div>
		</aside>
	);
}
