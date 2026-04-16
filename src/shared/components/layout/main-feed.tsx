import { RatingCard } from "~/features/ratings/components/rating-card";
import { RatingCardSkeleton } from "~/features/ratings/components/rating-card-skeleton";
import { useFeedRatings } from "~/features/ratings/hooks/display";
import { useEffect, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { ArrowLeft } from "lucide-react";
import { useCanGoBack, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { authQueryOptions } from "~/features/auth/hooks";
import { useSkeletonFade } from "~/shared/hooks/use-skeleton-fade";
import { m } from "~/paraglide/messages";

export function MainFeed({ tag }: { tag?: string }) {
	const { data: user } = useQuery(authQueryOptions());
	const isAuthenticated = user != null;
	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		error,
	} = useFeedRatings(10, isAuthenticated, tag);

	const { ref, inView } = useInView();
	const router = useRouter();
	const canGoBack = useCanGoBack();
	const { showSkeleton, skeletonClass, contentKey } =
		useSkeletonFade(isLoading);

	useEffect(() => {
		if (inView && hasNextPage) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, fetchNextPage]);

	const ratings = useMemo(
		() => data?.pages.flatMap((page) => (page.success ? page.data : [])) || [],
		[data?.pages],
	);

	if (showSkeleton) {
		return (
			<div className={skeletonClass}>
				{[0, 1, 2, 3, 4, 5].map((n, idx) => (
					<div
						key={n}
						className={
							idx === 0
								? "-mx-4 hover:bg-neutral-800/50 transition-colors"
								: "-mx-4 border-t border-neutral-800 hover:bg-neutral-800/50 transition-colors"
						}
						style={{ opacity: Math.max(0.05, 1 - idx * 0.15) }}
					>
						<RatingCardSkeleton variant="rating" showImage={idx % 2 === 0} />
					</div>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-4 text-center text-neutral-500">
				{m.feed_error_loading({ message: error.message })}
			</div>
		);
	}

	return (
		<div key={contentKey} className="animate-skeleton-reveal">
			{tag && (
				<div className="border-b border-neutral-800 px-3 py-2">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<button
								type="button"
								className="flex items-center justify-center p-2 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
								onClick={(e) => {
									e.stopPropagation();
									if (canGoBack) {
										router.history.back();
									} else {
										router.navigate({ to: "/" });
									}
								}}
							>
								<ArrowLeft className="h-5 w-5 shrink-0" />
							</button>
							<h2 className="text-lg font-semibold text-white">
								{m.feed_tag_header_prefix()}
								<span className="inline-flex items-center px-1 py-0.2 bg-neutral-800/70 text-neutral-300 text-base font-medium transition-colors rounded-md ml-1 font-sans">
									#{tag}
								</span>{" "}
								tag
							</h2>
						</div>
					</div>
				</div>
			)}

			<div>
				{ratings.map((rating, idx) => {
					if (!rating) return null;
					return (
						<div
							key={rating.id}
							className={
								idx === 0
									? "-mx-4 hover:bg-neutral-800/50 transition-colors"
									: "-mx-4 border-t border-neutral-800 hover:bg-neutral-800/50 transition-colors"
							}
						>
							<div className="px-4">
								<RatingCard rating={rating} isAuthenticated={isAuthenticated} />
							</div>
						</div>
					);
				})}
			</div>

			{isFetchingNextPage ? (
				<div className="-mx-4 border-t border-neutral-800">
					<div className="px-4 pt-8 pb-12 text-center text-sm text-neutral-500">
						Loading more...
					</div>
				</div>
			) : hasNextPage ? (
				<div className="-mx-4 border-t border-neutral-800">
					<div ref={ref} className="h-4" />
				</div>
			) : (
				<div className="-mx-4 border-t border-neutral-800">
					<div className="px-4 pt-8 pb-12 text-center text-sm text-neutral-500">
						{m.feed_all_caught_up()}
					</div>
				</div>
			)}
		</div>
	);
}
