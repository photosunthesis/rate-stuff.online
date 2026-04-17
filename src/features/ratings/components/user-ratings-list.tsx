import { useUserRatings } from "~/features/ratings/hooks/display";
import { RatingCard } from "./rating-card";
import { useEffect, useRef, useMemo } from "react";
import { RatingCardSkeleton } from "~/features/ratings/components/rating-card-skeleton";
import { useSkeletonFade } from "~/shared/hooks/use-skeleton-fade";

export function UserRatingsList() {
	const {
		data,
		isLoading,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useUserRatings(10); // Limit of 10 ratings per page

	const observerTarget = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
					fetchNextPage();
				}
			},
			{ threshold: 0.1 },
		);

		if (observerTarget.current) {
			observer.observe(observerTarget.current);
		}

		return () => {
			if (observerTarget.current) {
				observer.unobserve(observerTarget.current);
			}
		};
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	const allRatings = useMemo(
		() => data?.pages.flatMap((page) => page.data || []) || [],
		[data?.pages],
	);

	const { showSkeleton, skeletonClass, contentKey } =
		useSkeletonFade(isLoading);

	if (showSkeleton) {
		return (
			<div className={skeletonClass}>
				{[0, 1, 2, 3, 4, 5].map((n, idx) => (
					<div
						key={n}
						className={
							idx === 0 ? "-mx-4" : "-mx-4 border-t border-neutral-800"
						}
						style={{ opacity: Math.max(0.05, 1 - idx * 0.15) }}
					>
						<RatingCardSkeleton
							variant="user"
							noIndent
							showImage={idx % 2 === 0}
						/>
					</div>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-base">
				Failed to load ratings. Please try again.
			</div>
		);
	}

	if (allRatings.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-neutral-400">You haven't rated anything yet.</p>
			</div>
		);
	}

	return (
		<div key={contentKey} className="animate-skeleton-reveal">
			<div className="divide-y divide-neutral-800">
				{allRatings.map((rating) => (
					<RatingCard key={rating.id} rating={rating} isAuthenticated={true} />
				))}
			</div>

			{hasNextPage && (
				<div ref={observerTarget} className="py-4 text-center">
					{isFetchingNextPage ? (
						<div className="flex justify-center">
							<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
						</div>
					) : (
						<p className="text-neutral-400 text-base">Scroll for more...</p>
					)}
				</div>
			)}
		</div>
	);
}
