import { useNavigate } from "@tanstack/react-router";
import { RatingCard } from "~/features/display-ratings/components/rating-card";
import { Button } from "~/components/ui/button";
import { RatingCardSkeleton } from "~/components/ui/rating-card-skeleton";
import { useFeedRatings } from "~/features/display-ratings/queries";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import type { PublicUser } from "~/features/auth/types";
import { Delete } from "lucide-react";

export function MainFeed({ tag, user }: { tag?: string; user?: PublicUser }) {
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
				{[0, 1, 2, 3, 4, 5].map((n, idx) => (
					<div
						key={n}
						className={
							idx === 0
								? "-mx-4 hover:bg-neutral-800/50 transition-colors"
								: "-mx-4 border-t border-neutral-800 hover:bg-neutral-800/50 transition-colors"
						}
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
				Error loading ratings: {error.message}
			</div>
		);
	}

	return (
		<>
			{tag && (
				<div className="border-b border-neutral-800 px-4 py-2">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-lg font-semibold text-white">
								Ratings with the
								<span className="inline-flex items-center px-1 py-0.2 bg-neutral-800/70 text-neutral-300 text-sm font-medium transition-colors rounded-md ml-1 font-sans">
									#{tag}
								</span>{" "}
								tag
							</h2>
						</div>
						<Button
							variant="secondary"
							size="sm"
							className="w-auto! inline-flex items-center px-3 py-1 text-sm"
							onClick={(e) => {
								e.stopPropagation();
								navigate({ to: "/" });
							}}
						>
							<Delete className="mr-2 h-4 w-4 shrink-0" />
							Clear
						</Button>
					</div>
				</div>
			)}

			{/* Create rating trigger moved to sidebar (desktop) and a floating action button on mobile */}

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
							<div className="px-4 -my-1">
								<RatingCard rating={rating} isAuthenticated={isAuthenticated} />
							</div>
						</div>
					);
				})}
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
							All caught up! \(￣▽￣)/
						</div>
					</div>
				)
			) : null}
		</>
	);
}
