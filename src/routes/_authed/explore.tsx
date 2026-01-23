import { createFileRoute } from "@tanstack/react-router";
import { MainLayout } from "~/components/layout/main-layout";
import { authQueryOptions } from "~/features/auth/queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { mapToCurrentUser } from "~/utils/user-mapping";
import { useVisualRatings } from "~/features/explore/queries";
import { VisualRatingCard } from "~/features/explore/components/visual-rating-card";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authed/explore")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{ title: "Explore - Rate Stuff Online" },
			{
				name: "description",
				content:
					"Discover trending ratings and visual content from the Rate Stuff Online community.",
			},
		],
	}),
});

function RouteComponent() {
	const { data: user } = useSuspenseQuery(authQueryOptions());
	const currentUser = mapToCurrentUser(user);

	return (
		<MainLayout user={currentUser}>
			<Suspense fallback={<ExploreSkeleton />}>
				<ExploreContent />
			</Suspense>
		</MainLayout>
	);
}

function ExploreSkeleton() {
	return (
		<div className="space-y-8 pb-12 px-4">
			<div className="flex items-center gap-2 mb-6">
				<div className="w-5 h-5 bg-neutral-800 rounded animate-pulse" />
				<div className="w-48 h-6 bg-neutral-800 rounded animate-pulse" />
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="grid gap-4">
					{[1, 2, 3].map((i) => (
						<div
							key={`skeleton-item-1-${i}`}
							className="rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 animate-pulse relative"
							style={{ height: `${Math.floor(Math.random() * 200 + 200)}px` }}
						>
							<div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
								<div className="w-3/4 h-4 bg-neutral-800 rounded" />
								<div className="w-1/2 h-3 bg-neutral-800 rounded" />
							</div>
						</div>
					))}
				</div>
				<div className="hidden md:grid gap-4">
					{[1, 2, 3].map((i) => (
						<div
							key={`skeleton-item-2-${i}`}
							className="rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 animate-pulse relative"
							style={{ height: `${Math.floor(Math.random() * 200 + 200)}px` }}
						>
							<div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
								<div className="w-3/4 h-4 bg-neutral-800 rounded" />
								<div className="w-1/2 h-3 bg-neutral-800 rounded" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function ExploreContent() {
	const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useVisualRatings();

	const loadMoreRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
					fetchNextPage();
				}
			},
			{ threshold: 0.5 },
		);

		if (loadMoreRef.current) {
			observer.observe(loadMoreRef.current);
		}

		return () => observer.disconnect();
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	const allItems = useMemo(() => {
		return data?.pages.flatMap((page) => (page ? page.items : [])) ?? [];
	}, [data]);

	const columns = useMemo(() => {
		const cols: (typeof allItems)[] = [[], []];
		allItems.forEach((item, i) => {
			cols[i % 2].push(item);
		});
		return cols;
	}, [allItems]);

	if (!data) return null;

	return (
		<div className="space-y-8 pb-12 px-4">
			<div className="flex items-center gap-2 my-4">
				<h2 className="text-xl font-bold text-white">Explore</h2>
				<TrendingUp className="w-5 h-5 text-white" />
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Mobile only: single column with all items in order */}
				<div className="md:hidden grid gap-4">
					{allItems.map((item) => (
						<VisualRatingCard
							key={item.id}
							rating={item}
							user={item.user}
							stuff={item.stuff}
						/>
					))}
				</div>

				{/* Desktop only: two columns for masonry-like layout */}
				{columns.map((colItems, colIndex) => (
					<div
						key={colIndex === 0 ? "left-column" : "right-column"}
						className="hidden md:grid gap-4 content-start"
					>
						{colItems.map((item) => (
							<VisualRatingCard
								key={item.id}
								rating={item}
								user={item.user}
								stuff={item.stuff}
							/>
						))}
					</div>
				))}
			</div>

			<div ref={loadMoreRef} className="py-8 flex justify-center">
				{isFetchingNextPage ? (
					<p className="text-neutral-500 text-sm">Getting more...</p>
				) : hasNextPage ? (
					<div className="h-8" />
				) : (
					<div className="px-4 pt-8 pb-6 text-center text-neutral-500">
						All caught up \(￣▽￣)/
					</div>
				)}
			</div>
		</div>
	);
}
