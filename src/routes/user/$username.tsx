import { createFileRoute, redirect } from "@tanstack/react-router";
import { NotFound } from "~/components/ui/not-found";
import { Avatar } from "~/components/ui/avatar";
import { RatingCardSkeleton } from "~/components/ui/rating-card-skeleton";
import { usePublicUserRatings } from "~/features/display-ratings/queries";
import { RatingCard } from "~/components/ui/rating-card";
import { useEffect, useRef, useMemo } from "react";
import { getTimeAgo } from "~/utils/datetime";
import { MainLayout } from "~/components/layout/main-layout";
import { userQueryOptions } from "~/features/auth/queries";

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
			{
				name: "og:site_name",
				property: "og:site_name",
				content: "Rate Stuff Online",
			},
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

		const pageUrl = `https://rate-stuff.online/user/${params.username}`;

		if (user?.image) {
			metas.push({
				name: "og:image",
				property: "og:image",
				content: user.image,
			});
			metas.push({ name: "twitter:image", content: user.image });
		}

		const ld = {
			"@context": "https://schema.org",
			"@type": "ProfilePage",
			mainEntity: {
				"@type": "Person",
				name: user?.name ?? `@${params.username}`,
				url: pageUrl,
				image: user?.image ?? undefined,
				sameAs: undefined,
			},
			name: title,
			description,
			url: pageUrl,
		};

		if (user?.createdAt) {
			try {
				ld.mainEntity = {
					// biome-ignore lint/suspicious/noExplicitAny: okk to use here :D
					...(ld as any).mainEntity,
					birthDate: new Date(user.createdAt).toISOString(),
				};
			} catch {}
		}

		return {
			meta: metas,
			links: [{ rel: "canonical", href: `/user/${params.username}` }],
			scripts: [{ type: "application/ld+json", children: JSON.stringify(ld) }],
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
	const {
		data,
		isLoading,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = usePublicUserRatings(username, 10, isAuthenticated); // Limit of 10 ratings per page

	const observerTarget = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (
					entries[0].isIntersecting &&
					hasNextPage &&
					!isFetchingNextPage &&
					isAuthenticated
				) {
					fetchNextPage?.();
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

	const allRatings = useMemo(
		() => data?.pages.flatMap((p) => p.data || []) || [],
		[data?.pages],
	);

	if (isLoading) {
		return (
			<div className="-mx-2">
				<div className="divide-y divide-neutral-800">
					{[1, 2, 3, 4, 5].map((i) => (
						<RatingCardSkeleton
							key={i}
							noIndent
							hideAvatar
							showImage={i % 2 === 0}
						/>
					))}
				</div>
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
					<div key={rating.id} className="px-4">
						<RatingCard
							key={rating.id}
							rating={rating}
							noIndent
							isAuthenticated={isAuthenticated}
							variant="userProfile"
						/>
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
			<div className="flex items-center gap-4 m-4">
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
