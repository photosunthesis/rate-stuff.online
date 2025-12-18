import { Link } from "@tanstack/react-router";
import type { Review } from "~/data/mock-reviews";
import { ReviewCard } from "~/components/ui/review-card";

interface MainFeedProps {
	reviews: Review[];
	isAuthenticated: boolean;
}

export function MainFeed({ reviews, isAuthenticated }: MainFeedProps) {
	return (
		<main className="border-x border-neutral-800 w-full max-w-2xl">
			{/* Feed */}
			<div className="divide-y divide-neutral-800">
				{reviews.map((review) => (
					<ReviewCard key={review.id} review={review} />
				))}
			</div>

			{/* Sign In Prompt (only when not authenticated) */}
			{!isAuthenticated && (
				<div className="border-t border-neutral-800 px-4 py-8 text-center">
					<div className="mb-4">
						<p className="text-neutral-400 text-sm">
							To see more reviews, create an account or sign in.
						</p>
					</div>

					<div className="flex gap-3 justify-center">
						<Link
							to="/create-account"
							className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded transition-colors text-sm flex items-center justify-center"
						>
							Create Account
						</Link>
						<Link
							to="/sign-in"
							className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded border border-neutral-700 transition-colors text-sm flex items-center justify-center"
						>
							Sign In
						</Link>
					</div>
				</div>
			)}
		</main>
	);
}
