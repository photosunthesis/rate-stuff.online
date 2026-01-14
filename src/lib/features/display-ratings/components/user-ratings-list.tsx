import { useUserRatings } from "../queries";
import { RatingCard } from "./rating-card";
import { useEffect, useRef } from "react";
import { RatingCardSkeleton } from "~/components/ui/rating-card-skeleton";

const LIMIT = 10;

export function UserRatingsList() {
	const {
		data,
		isLoading,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useUserRatings(LIMIT);

	const observerTarget = useRef<HTMLDivElement>(null);

	// Intersection Observer for infinite scroll
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

	if (isLoading) {
		return (
			<div>
				{[0, 1, 2].map((n, idx) => (
					<div
						key={n}
						className={
							idx === 0 ? "-mx-4" : "-mx-4 border-t border-neutral-800"
						}
					>
						<div className="px-4 py-3">
							<RatingCardSkeleton variant="user" noIndent />
						</div>
					</div>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
				Failed to load ratings. Please try again.
			</div>
		);
	}

	// Flatten all pages into a single array
	const allRatings = data?.pages.flatMap((page) => page.data || []) || [];

	if (allRatings.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-neutral-500">You haven't rated anything yet.</p>
			</div>
		);
	}

	return (
		<>
			<div className="divide-y divide-neutral-800">
				{allRatings.map((rating) => (
					<RatingCard key={rating.id} rating={rating} />
				))}
			</div>

			{/* Intersection observer target for infinite scroll */}
			{hasNextPage && (
				<div ref={observerTarget} className="py-4 text-center">
					{isFetchingNextPage ? (
						<div className="flex justify-center">
							<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
						</div>
					) : (
						<p className="text-neutral-500 text-sm">Scroll for more...</p>
					)}
				</div>
			)}
		</>
	);
}
