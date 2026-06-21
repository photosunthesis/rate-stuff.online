import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import {
	useRecentTags,
	useRecentStuff,
	useLatestStuff,
} from "~/features/ratings/hooks/display";
import { useAuth } from "~/features/auth/hooks";
import { useAuthModal } from "~/features/auth/components/auth-modal-provider";
import { useSkeletonFade } from "~/shared/hooks/use-skeleton-fade";

export function DiscoverStrip() {
	const { data: user } = useAuth();
	const isAuthenticated = user != null;
	const { data: latestStuff, isLoading: loadingLatest } =
		useLatestStuff(isAuthenticated);
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

	const { openAuthModal } = useAuthModal();
	const stripFade = useSkeletonFade(
		loadingLatest || loadingStuff || loadingTags,
	);

	// The trending list ("recentStuff", ordered by count) can overlap the recency
	// list ("latestStuff", ordered by time); show each stuff only once.
	const latestStuffIds = useMemo(
		() => new Set((latestStuff ?? []).map((s) => s.id)),
		[latestStuff],
	);

	// Visibility is owned by MainLayout via the showDiscoverStrip prop (route +
	// no-tag), so we don't re-derive the route here — a one-shot window check
	// would go stale across client-side navigation.
	if (!isAuthenticated) return null;

	return (
		<div className="w-full block lg:hidden border-neutral-800 md:border-l md:border-r">
			{/* The fade lives on this non-scrolling wrapper, NOT on the scroller
			    below: a CSS mask on an overflow-x-auto element breaks touch
			    panning on mobile Safari/Chrome. */}
			<div
				style={{
					maskImage: "linear-gradient(to right, black 80%, transparent 100%)",
					WebkitMaskImage:
						"linear-gradient(to right, black 80%, transparent 100%)",
				}}
			>
				<div
					key={stripFade.contentKey}
					className={`overflow-x-auto hide-scrollbar whitespace-nowrap flex items-center gap-2 px-4 py-3 ${
						stripFade.showSkeleton
							? stripFade.skeletonClass
							: "animate-skeleton-reveal"
					}`}
					style={{ WebkitOverflowScrolling: "touch" }}
				>
					{stripFade.showSkeleton ? (
						<>
							{skeletonStuffKeys.map((sKey) => (
								<div
									key={sKey}
									className="inline-flex shrink-0 items-center bg-neutral-800/40 rounded-lg animate-skeleton-pulse"
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
									className={`inline-flex shrink-0 items-center h-6 ${w} bg-neutral-800/40 rounded-lg animate-skeleton-pulse`}
								/>
							))}
						</>
					) : (
						<>
							{(latestStuff ?? []).map((stuff) => (
								<Link
									key={`latest-${stuff.id}`}
									to="/stuff/$stuffSlug"
									params={{ stuffSlug: stuff.slug }}
									className="inline-flex shrink-0 items-center py-0.5 pl-0.5 pr-3 leading-none bg-neutral-800 text-white text-base font-medium rounded-lg"
								>
									<div className="flex items-center mr-0.5">
										<div className="w-5 h-5 bg-neutral-800 rounded-full shrink-0 flex items-center justify-center">
											<TrendingUp
												className="w-4 h-4 text-neutral-300"
												aria-hidden
											/>
										</div>
									</div>
									{stuff.name}
								</Link>
							))}

							{(recentStuff ?? [])
								.filter((stuff) => !latestStuffIds.has(stuff.id))
								.map((stuff) => (
									<Link
										key={stuff.id}
										to="/stuff/$stuffSlug"
										params={{ stuffSlug: stuff.slug }}
										className="inline-flex shrink-0 items-center py-0.5 pl-0.5 pr-3 leading-none bg-neutral-800 text-white text-base font-medium rounded-lg"
									>
										<div className="flex items-center mr-0.5">
											<div className="w-5 h-5 bg-neutral-800 rounded-full shrink-0 flex items-center justify-center">
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
										className="inline-flex shrink-0 items-center px-2 py-1 leading-none bg-neutral-800/70 text-neutral-300 hover:text-neutral-300 text-base font-medium transition-colors rounded-lg"
									>
										#{tag.name}
									</Link>
								) : (
									<button
										key={tag.name}
										type="button"
										onClick={() => openAuthModal()}
										className="inline-flex shrink-0 items-center px-2 py-1 leading-none bg-neutral-800/70 text-neutral-300 hover:text-neutral-300 text-base font-medium transition-colors rounded-lg cursor-pointer"
									>
										#{tag.name}
									</button>
								),
							)}
						</>
					)}
				</div>
			</div>

			<div className="border-t border-neutral-800" />
		</div>
	);
}
