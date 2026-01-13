import { useStuffRatingsInfinite } from "../hooks";
import { StuffRatingCard } from "./stuff-rating-card";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { RatingCardSkeleton } from "~/components/skeletons/rating-card-skeleton";
import { getStuffRatingsFn } from "../api";
import type { RatingWithRelations } from "~/lib/features/display-ratings/types";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

type Page = {
	success: boolean;
	data?: RatingWithRelations[];
	nextCursor?: string;
	error?: string;
};

const LIMIT = 10;

export function StuffRatingsList({
	slug,
	user,
}: {
	slug: string;
	user?: { name?: string; image?: string };
}) {
	// Default placeholders for the various query values so we can handle
	// both authenticated (infinite) and guest (single page) flows uniformly.
	let data: unknown | undefined;
	let isLoading = false;
	let error: unknown = null;
	let fetchNextPage: (() => void) | undefined;
	let hasNextPage = false;
	let isFetchingNextPage = false;

	// Call hooks unconditionally; enable/disable fetch based on auth state.
	const isAuthenticated = user != null;
	const authQuery = useStuffRatingsInfinite(slug, LIMIT, isAuthenticated);
	const getStuffRatingsFnClient = useServerFn(getStuffRatingsFn);
	const guestQuery = useQuery({
		queryKey: ["stuff", slug, "ratings", "guest"],
		queryFn: async () => {
			const res = (await getStuffRatingsFnClient({
				data: { slug, limit: LIMIT },
			})) as Page;
			if (!res.success) throw new Error(res.error ?? "Failed to load ratings");
			return res;
		},
		enabled: !isAuthenticated,
		staleTime: 0,
		gcTime: 1000 * 60 * 10,
	});

	if (isAuthenticated) {
		data = authQuery.data;
		isLoading = authQuery.isLoading;
		error = authQuery.error;
		fetchNextPage = authQuery.fetchNextPage;
		hasNextPage = !!authQuery.hasNextPage;
		isFetchingNextPage = authQuery.isFetchingNextPage;
	} else {
		data = guestQuery.data ? { pages: [guestQuery.data] } : undefined;
		isLoading = guestQuery.isLoading;
		error = guestQuery.error ?? null;
		fetchNextPage = undefined;
		hasNextPage = false;
		isFetchingNextPage = false;
	}

	// Direct client-side debug fetch to verify server response (visible in console)
	const getStuffRatings = useServerFn(getStuffRatingsFn);
	const [debugResp, setDebugResp] = useState<Record<string, unknown> | null>(
		null,
	);
	useEffect(() => {
		let mounted = true;
		getStuffRatings({ data: { slug, limit: LIMIT } })
			.then((r) => {
				if (!mounted) return;
				setDebugResp(r);
			})
			.catch((err) => {
				setDebugResp({ error: String(err) });
			});
		return () => {
			mounted = false;
		};
	}, [slug, getStuffRatings]);
	const observerTarget = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (
					entries[0].isIntersecting &&
					hasNextPage &&
					!isFetchingNextPage &&
					fetchNextPage
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
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
				{[0, 1, 2].map((n, idx) => (
					<div
						key={n}
						className={
							idx === 0 ? "-mx-4" : "-mx-4 border-t border-neutral-800"
						}
						data-skel-item
					>
						<div className="px-4 py-2">
							<RatingCardSkeleton variant="stuff" />
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

	const pages = data as unknown as { pages?: Page[] } | undefined;
	const allRatings = pages?.pages?.flatMap((p) => p.data ?? []) ?? [];

	// If no ratings yet (or response empty) still render an empty state but don't crash
	if (allRatings.length === 0 && !isFetchingNextPage) {
		return (
			<div className="text-center py-12">
				<p className="text-neutral-500">No ratings yet.</p>
				{debugResp && (
					<pre className="text-xs text-left text-neutral-400 mt-4 p-2 bg-neutral-900 rounded">
						{JSON.stringify(debugResp, null, 2)}
					</pre>
				)}
			</div>
		);
	}

	return (
		<>
			<div>
				{allRatings.map((rating: RatingWithRelations, idx) => (
					<div
						key={rating.id}
						className={
							idx === 0
								? "-mx-4 hover:bg-neutral-800/50 transition-colors"
								: "-mx-4 border-t border-neutral-800 hover:bg-neutral-800/50 transition-colors"
						}
					>
						<div className="px-4 py-2">
							<StuffRatingCard rating={rating} />
						</div>
					</div>
				))}
			</div>

			{isAuthenticated ? (
				hasNextPage && (
					<div ref={observerTarget} className="py-4 text-center">
						{isFetchingNextPage ? (
							<div className="flex justify-center">
								<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
							</div>
						) : (
							<p className="text-neutral-500 text-sm">Scroll for more...</p>
						)}
					</div>
				)
			) : (
				<div className="-mx-4 border-t border-neutral-800 px-4 py-8 text-center">
					<div className="mb-4">
						<p className="text-neutral-400 text-sm">Curious to see more? </p>
					</div>
					<div className="flex gap-3 justify-center">
						<Link
							to="/create-account"
							className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center"
						>
							Create Account
						</Link>
						<Link
							to="/sign-in"
							search={{ redirect: undefined }}
							className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl border border-neutral-700 transition-colors text-sm flex items-center justify-center"
						>
							Sign In
						</Link>
					</div>
				</div>
			)}
		</>
	);
}
