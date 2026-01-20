import { RatingCard } from "~/components/ui/rating-card";
import { useCallback, useEffect, useRef, useState } from "react";
import { RatingCardSkeleton } from "~/components/ui/rating-card-skeleton";
import type { StuffRating } from "../types";
import type { PublicUser } from "~/features/auth/types";
import { type InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPaginatedStuffRatingsFn } from "../functions";

type PageResult = {
	success: boolean;
	data?: StuffRating[];
	nextCursor?: string;
	error?: string;
};

const useStuffRatingsInfinite = (slug: string, limit = 10, enabled = true) => {
	const getPaginatedStuffRatings = useServerFn(getPaginatedStuffRatingsFn);

	return useInfiniteQuery<
		PageResult,
		Error,
		{ ratings: StuffRating[] },
		readonly ["stuff", string, "ratings", number],
		string | undefined
	>({
		queryKey: ["stuff", slug, "ratings", limit],
		queryFn: async ({ pageParam }: { pageParam?: string }) => {
			const res = (await getPaginatedStuffRatings({
				data: { slug, limit, cursor: pageParam },
			})) as PageResult;

			if (!res.success) throw new Error(res.error ?? "Failed to load ratings");

			return res;
		},
		getNextPageParam: (lastPage) => {
			if (!lastPage?.success) return undefined;
			return lastPage.nextCursor;
		},
		initialPageParam: undefined,
		staleTime: 1000 * 60, // 1 minute
		gcTime: 1000 * 60 * 10,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		enabled,
		select: useCallback(
			(data: InfiniteData<PageResult>) => ({
				ratings: data.pages.flatMap((page) => page.data ?? []),
			}),
			[],
		),
	});
};

export function StuffRatingsList({
	slug,
	user,
}: {
	slug: string;
	user?: PublicUser;
}) {
	const isAuthenticated = user != null;
	const {
		data,
		isLoading,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useStuffRatingsInfinite(slug, 10, true);

	const allRatings = data?.ratings ?? [];
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
		if (isLoading) {
			setLoadingSeenOnce(true);
			setShowSkeleton(true);
			setSkeletonFading(false);
		}
	}, [isLoading]);

	useEffect(() => {
		if (!isLoading && showSkeleton && loadingSeenOnce) {
			setSkeletonFading(true);
			const t = setTimeout(() => {
				setShowSkeleton(false);
				setSkeletonFading(false);
			}, 300);
			return () => clearTimeout(t);
		}
	}, [isLoading, showSkeleton, loadingSeenOnce]);

	useEffect(() => {
		const ratingsPresent = allRatings.length > 0;
		if (ratingsPresent) {
			setShowSkeleton(false);
			setSkeletonFading(false);
		}

		if (!ratingsPresent && isLoading) {
			setShowSkeleton(true);
		}
	}, [allRatings, isLoading]);

	if (showSkeleton) {
		return (
			<div
				className={`py-2 transition-opacity duration-300 ${skeletonFading ? "opacity-0" : "opacity-100"}`}
				data-skeleton
			>
				{[0, 1, 2, 3, 4, 5].map((n, idx) => (
					<div
						key={n}
						className={idx === 0 ? "" : "border-t border-neutral-800"}
						data-skel-item
						style={{ opacity: Math.max(0.05, 1 - idx * 0.15) }}
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
						<RatingCard rating={rating} isAuthenticated={isAuthenticated} />
					</div>
				))}
			</div>

			{isFetchingNextPage ? (
				<div className="border-t border-neutral-800">
					<div className="px-4 pt-8 pb-12 text-center text-neutral-500">
						Loading more...
					</div>
				</div>
			) : hasNextPage ? (
				<div ref={observerTarget} className="py-4 text-center">
					<p className="text-neutral-500 text-sm">Scroll for more...</p>
				</div>
			) : (
				<div className="border-t border-neutral-800">
					<div className="px-4 pt-8 pb-12 text-center text-neutral-500">
						All caught up! \(￣▽￣)/
					</div>
				</div>
			)}
		</>
	);
}
