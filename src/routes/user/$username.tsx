import { createFileRoute, redirect } from "@tanstack/react-router";
import { NotFound } from "~/components/ui/not-found";
import { Avatar } from "~/components/ui/avatar";
import { usePublicUserRatings } from "~/lib/features/display-ratings/queries";
import { UserRatingCard } from "~/lib/features/display-ratings/components/user-rating-card";
import { useEffect, useRef } from "react";
import { getTimeAgo } from "~/lib/utils/datetime";
import { MainLayout } from "~/components/layout/main-layout";
import { userQueryOptions } from "~/lib/features/auth/queries";

export const Route = createFileRoute("/user/$username")({
	beforeLoad: async ({ params, context }) => {
		const username = params.username;

		if (!username) throw redirect({ to: "/" });

		const publicUser = await context.queryClient.ensureQueryData(
			userQueryOptions(username),
		);

		return { publicUser };
	},
	component: RouteComponent,
	head: ({ params, match }) => {
		const cached = match.context.queryClient.getQueryData(
			userQueryOptions(params.username).queryKey,
		);

		const user = cached ?? null;

		const title = user
			? user.name
				? `${user.name} (@${user.username}) — Rate Stuff`
				: `@${user.username} — Rate Stuff`
			: `@${params.username} — Rate Stuff`;

		const description = user
			? `${user.name ?? `@${user.username}`} has ${user.ratingsCount ?? 0} ${
					(user.ratingsCount ?? 0) === "1" ? "rating" : "ratings"
				} on Rate Stuff.`
			: `View ratings and profile for @${params.username} on Rate Stuff.`;

		const metas: Record<string, string | undefined>[] = [
			{ title },
			{ name: "description", content: description },
			{ name: "og:title", property: "og:title", content: title },
			{
				name: "og:description",
				property: "og:description",
				content: description,
			},
			{ name: "og:type", property: "og:type", content: "profile" },
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: title },
			{ name: "twitter:description", content: description },
			{ name: "robots", content: "index, follow" },
		];

		if (user?.image) {
			metas.push({
				name: "og:image",
				property: "og:image",
				content: user.image,
			});
			metas.push({ name: "twitter:image", content: user.image });
		}

		return {
			meta: metas,
			links: [{ rel: "canonical", href: `/user/${params.username}` }],
		};
	},
});

function UserRatingsList({
	username,
	isAuthenticated,
}: {
	username: string;
	isAuthenticated: boolean;
}) {
	const LIMIT = isAuthenticated ? 12 : 10;
	const {
		data,
		isLoading,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = usePublicUserRatings(username, LIMIT, isAuthenticated);

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

	if (isLoading) {
		return (
			<div className="flex justify-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
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

	const allRatings = data?.pages.flatMap((p) => p.data || []) || [];

	if (allRatings.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-neutral-500">No ratings yet.</p>
			</div>
		);
	}

	return (
		<>
			<div className="-mx-4 divide-y divide-neutral-800">
				{allRatings.map((rating) => (
					<UserRatingCard key={rating.id} rating={rating} noIndent />
				))}
			</div>

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

function RouteComponent() {
	const { user, publicUser } = Route.useRouteContext();
	const currentUser = user
		? {
				id: user.id ?? "",
				username: user.username ?? "",
				name: user.name === user.username ? null : (user.name ?? null),
				image: user.image ?? "",
			}
		: undefined;

	if (!publicUser) return <NotFound />;

	const ratingsCount = publicUser.ratingsCount ?? 0;

	return (
		<MainLayout user={currentUser}>
			<div className="flex items-center gap-4 mb-4">
				<div>
					<Avatar
						src={publicUser.image ?? null}
						alt={publicUser.name ?? `@${publicUser.username}`}
						size="xl"
					/>
					{publicUser.name ? (
						<div className="baseline flex flex-row mt-2 items-baseline gap-1.5">
							<span className="text-white font-semibold text-lg">
								{publicUser.name}
							</span>
							<span className="text-neutral-500 text-md font-medium">
								(@{publicUser.username})
							</span>
						</div>
					) : (
						<div className="text-white font-semibold text-lg">
							@{publicUser.username}
						</div>
					)}
					<div className="text-neutral-500 text-sm">
						{publicUser.createdAt ? (
							<>
								Joined {getTimeAgo(publicUser.createdAt)} · {ratingsCount}{" "}
								{ratingsCount === "1" ? "rating" : "ratings"}
							</>
						) : null}
					</div>
				</div>
			</div>

			<div className="-mx-4 border-t border-neutral-800" />

			<UserRatingsList
				username={publicUser.username}
				isAuthenticated={user != null}
			/>
		</MainLayout>
	);
}
