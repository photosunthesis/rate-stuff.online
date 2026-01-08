import { Link } from "@tanstack/react-router";
import { RatingCard } from "~/features/ratings/components/rating-card";
import { useIsAuthenticated } from "~/features/session/queries";
import { useFeedRatings } from "~/features/ratings/queries";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

export function MainFeed() {
	const { isAuthenticated } = useIsAuthenticated();
	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		error,
	} = useFeedRatings(10);
	const { ref, inView } = useInView();

	useEffect(() => {
		if (inView && hasNextPage && isAuthenticated) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isAuthenticated, fetchNextPage]);

	const ratings =
		data?.pages.flatMap((page) => (page.success ? page.data : [])) || [];

	if (isLoading) {
		return <div className="p-4 text-center text-neutral-500">Loading...</div>;
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
			<div className="divide-y divide-neutral-800">
				{ratings.map((rating) => (
					<RatingCard key={rating.id} rating={rating} />
				))}
			</div>

			{isAuthenticated ? (
				isFetchingNextPage ? (
					<div className="p-4 text-center text-neutral-500">
						Loading more...
					</div>
				) : hasNextPage ? (
					<div ref={ref} className="h-4" />
				) : (
					<div className="p-4 text-center text-neutral-500">
						That's all the ratings as of now.
					</div>
				)
			) : (
				<div className="border-t border-neutral-800 px-4 py-8 text-center">
					<div className="mb-4">
						<p className="text-neutral-400 text-sm">
							To see more ratings, create an account or sign in.
						</p>
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
