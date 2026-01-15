import { useStuffRatingsInfinite } from "../hooks";
import { StuffRatingCard } from "./stuff-rating-card";
import { useEffect, useRef, useState } from "react";
import { RatingCardSkeleton } from "~/components/ui/rating-card-skeleton";
import type { StuffRating } from "../types";
import type { PublicUser } from "~/features/auth/types";

type Page = {
	success: boolean;
	data?: StuffRating[];
	nextCursor?: string;
	error?: string;
};

const LIMIT = 10;

export function StuffRatingsList({
	slug,
	user,
}: {
	slug: string;
	user?: PublicUser;
}) {
	// Default placeholders for the various query values so we can handle
	// both authenticated (infinite) and guest (single page) flows uniformly.
	let data: unknown | undefined;
	let isLoading = false;
	let error: unknown = null;
	let fetchNextPage: (() => void) | undefined;
	let hasNextPage = false;
	let isFetchingNextPage = false;

	// Consolidate to a single infinite query for both guest and authenticated users.
	// The hook fetches the first page for everyone; we only trigger loading more
	// pages when the user is authenticated (avoids extra guest pagination).
	const isAuthenticated = user != null;
	const ratingsQuery = useStuffRatingsInfinite(slug, LIMIT, true);

	data = ratingsQuery.data;
	isLoading = ratingsQuery.isLoading;
	error = ratingsQuery.error ?? null;
	fetchNextPage = ratingsQuery.fetchNextPage;
	hasNextPage = !!ratingsQuery.hasNextPage;
	isFetchingNextPage = ratingsQuery.isFetchingNextPage;

	const observerTarget = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (
					entries[0].isIntersecting &&
					hasNextPage &&
					!isFetchingNextPage &&
					fetchNextPage &&
					isAuthenticated
				) {
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
	}, [hasNextPage, isFetchingNextPage, fetchNextPage, isAuthenticated]);

	const [showSkeleton, setShowSkeleton] = useState(true);
	const [skeletonFading, setSkeletonFading] = useState(false);
	const [loadingSeenOnce, setLoadingSeenOnce] = useState(false);

	useEffect(() => {
		// If a load starts, ensure the skeleton is visible
		if (isLoading) {
			setLoadingSeenOnce(true);
			setShowSkeleton(true);
			setSkeletonFading(false);
		}
	}, [isLoading]);

	useEffect(() => {
		// When data arrives (but only after we've observed a load), fade out the skeleton and then remove it
		if (!isLoading && showSkeleton && loadingSeenOnce) {
			setSkeletonFading(true);
			const t = setTimeout(() => {
				setShowSkeleton(false);
				setSkeletonFading(false);
			}, 300);
			return () => clearTimeout(t);
		}
	}, [isLoading, showSkeleton, loadingSeenOnce]);

	// If we already have rating data (e.g. navigating back to the page), hide the skeleton immediately.
	useEffect(() => {
		const pagesObj = data as { pages?: Page[] } | undefined;
		const ratingsPresent =
			(pagesObj?.pages?.flatMap((p) => p.data ?? []) ?? []).length > 0;
		if (ratingsPresent) {
			// Immediately remove skeleton when real data is present (prevents stuck skeleton after navigation)
			setShowSkeleton(false);
			setSkeletonFading(false);
		}
		// If there's no data and a load is in progress, ensure skeleton is visible
		if (!ratingsPresent && isLoading) {
			setShowSkeleton(true);
		}
	}, [data, isLoading]);

	if (showSkeleton) {
		return (
			<div
				className={`py-2 transition-opacity duration-300 ${skeletonFading ? "opacity-0" : "opacity-100"}`}
				data-skeleton
			>
				{[0, 1, 2, 3, 4, 5].map((n, idx) => (
					<div
						key={n}
						className={
							idx === 0 ? "-mx-4" : "-mx-4 border-t border-neutral-800"
						}
						data-skel-item
					>
						<RatingCardSkeleton variant="stuff" showImage={idx % 2 === 0} />
					</div>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<div className="px-4 pt-8 pb-12 text-center text-neutral-500">
				Failed to load ratings. Please try again.
			</div>
		);
	}

	const pages = data as unknown as { pages?: Page[] } | undefined;
	const allRatings = pages?.pages?.flatMap((p) => p.data ?? []) ?? [];

	// If no ratings yet (or response empty) still render an empty state but don't crash
	if (allRatings.length === 0 && !isFetchingNextPage) {
		return (
			<div className="text-center py-12">
				<p className="text-neutral-500">No ratings yet.</p>
			</div>
		);
	}

	return (
		<>
			<div>
				{allRatings.map((rating: StuffRating, idx) => (
					<div
						key={rating.id}
						className={
							idx === 0
								? "hover:bg-neutral-800/50 transition-colors"
								: "border-t border-neutral-800 hover:bg-neutral-800/50 transition-colors"
						}
					>
						<StuffRatingCard rating={rating} />
					</div>
				))}
			</div>

			{isFetchingNextPage ? (
				<div className="-mx-4 border-t border-neutral-800">
					<div className="px-4 pt-8 pb-12 text-center text-neutral-500">
						Loading more...
					</div>
				</div>
			) : hasNextPage ? (
				<div ref={observerTarget} className="py-4 text-center">
					<p className="text-neutral-500 text-sm">Scroll for more...</p>
				</div>
			) : (
				<div className="-mx-4 border-t border-neutral-800">
					<div className="px-4 pt-8 pb-12 text-center text-neutral-500">
						All caught up! \(￣▽￣)/
					</div>
				</div>
			)}
		</>
	);
}
