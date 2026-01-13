import { Link, useNavigate } from "@tanstack/react-router";
import { RatingCard } from "~/lib/features/display-ratings/components/rating-card";
import { Button } from "~/components/ui/button";
import { RatingCardSkeleton } from "~/components/skeletons/rating-card-skeleton";
import { useFeedRatings } from "~/lib/features/display-ratings/queries";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

export function MainFeed({
	tag,
	user,
}: {
	tag?: string;
	user?: { username: string };
}) {
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
	const navigate = useNavigate();

	useEffect(() => {
		if (inView && hasNextPage && isAuthenticated) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isAuthenticated, fetchNextPage]);

	const ratings =
		data?.pages.flatMap((page) => (page.success ? page.data : [])) || [];

	if (isLoading) {
		return (
			<div>
				{[0, 1, 2].map((n, idx) => (
					<div
						key={n}
						className={
							idx === 0
								? "-mx-4 hover:bg-neutral-800/50 transition-colors"
								: "-mx-4 border-t border-neutral-800 hover:bg-neutral-800/50 transition-colors"
						}
					>
						<div className="px-4 py-3">
							<RatingCardSkeleton variant="rating" />
						</div>
					</div>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-4 text-center text-red-500">
				Error loading ratings: {error.message}
			</div>
		);
	}

	return (
		<>
			{tag && (
				<div className="px-4 py-4 border-b border-neutral-800">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-lg font-semibold text-white">
								Ratings with the #{tag} tag
							</h2>
							<p className="text-sm text-neutral-400">
								Showing results for #{tag}
							</p>
						</div>
						<Button
							variant="secondary"
							className="w-auto! inline-flex px-3 py-1 text-sm"
							onClick={(e) => {
								e.stopPropagation();
								navigate({ to: "/" });
							}}
						>
							Clear
						</Button>
					</div>
				</div>
			)}

			<div>
				{ratings.map((rating, idx) => (
					<div
						key={rating.id}
						className={
							idx === 0
								? "-mx-4 hover:bg-neutral-800/50 transition-colors"
								: "-mx-4 border-t border-neutral-800 hover:bg-neutral-800/50 transition-colors"
						}
					>
						<div className="px-4 py-3">
							<RatingCard key={rating.id} rating={rating} />
						</div>
					</div>
				))}
			</div>

			{isAuthenticated ? (
				isFetchingNextPage ? (
					<div className="-mx-4 border-t border-neutral-800">
						<div className="px-4 pt-8 pb-12 text-center text-neutral-500">
							Loading more...
						</div>
					</div>
				) : hasNextPage ? (
					<div className="-mx-4 border-t border-neutral-800">
						<div ref={ref} className="h-4" />
					</div>
				) : (
					<div className="-mx-4 border-t border-neutral-800">
						<div className="px-4 pt-8 pb-12 text-center text-neutral-500">
							All caught up! ＼(￣▽￣)／
						</div>
					</div>
				)
			) : (
				<div className="-mx-4 border-t border-neutral-800 px-4 py-8 text-center">
					<div className="mb-4">
						<p className="text-neutral-400 text-sm">Curious to see more? </p>
					</div>

					<div className="flex gap-3 justify-center">
						<Link
							to="/sign-up"
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
