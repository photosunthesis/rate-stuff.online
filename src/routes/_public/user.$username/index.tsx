import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { NotFound } from "~/shared/components/feedback/not-found";
import { Avatar } from "~/shared/components/ui/avatar";
import { RatingCardSkeleton } from "~/features/ratings/components/rating-card-skeleton";
import { usePublicUserRatings } from "~/features/ratings/hooks/display";
import { RatingCard } from "~/features/ratings/components/rating-card";
import { useEffect, useRef, useMemo } from "react";
import { Pencil } from "lucide-react";
import { TimeAgo } from "~/shared/components/ui/time-ago";
import { MainLayout } from "~/shared/components/layout/main-layout";
import { userQueryOptions, authQueryOptions } from "~/features/auth/hooks";
import { useSuspenseQuery } from "@tanstack/react-query";
import { m } from "~/paraglide/messages";

export const Route = createFileRoute("/_public/user/$username/")({
	beforeLoad: async ({ params, context }) => {
		const username = params.username;

		if (!username) throw redirect({ to: "/" });

		await context.queryClient.ensureQueryData(userQueryOptions(username));
	},
	component: RouteComponent,
	head: ({ params, match }) => {
		const cached = match.context.queryClient.getQueryData(
			userQueryOptions(params.username).queryKey,
		);

		const user = cached ?? null;

		const title = user
			? user.name
				? `${user.name} (@${user.username}) — Rate Stuff Online`
				: `@${user.username} — Rate Stuff Online`
			: `@${params.username} — Rate Stuff Online`;

		const description = user
			? `${user.name ?? `@${user.username}`} has ${user.ratingsCount ?? 0} ${
					(user.ratingsCount ?? 0) === "1"
						? m.rating_singular()
						: m.rating_plural()
				} on Rate Stuff Online.`
			: `View ratings and profile for @${params.username} on Rate Stuff Online.`;

		const pageUrl = `https://rate-stuff.online/user/${params.username}`;
		const userImage = user?.image ?? null;
		const fallbackImage =
			"https://rate-stuff.online/web-app-manifest-512x512.png";
		const finalImage = userImage || fallbackImage;

		const keywords = [
			`@${params.username}`,
			user?.name ?? "",
			"user profile",
			"ratings",
			"rate stuff online",
		]
			.filter(Boolean)
			.join(", ");

		const metas: Record<string, string | undefined>[] = [
			{ title },
			{ name: "description", content: description },
			{ name: "keywords", content: keywords },
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
			{ name: "og:url", property: "og:url", content: pageUrl },
			{
				name: "og:image",
				property: "og:image",
				content: finalImage,
			},
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: title },
			{ name: "twitter:description", content: description },
			{ name: "twitter:image", content: finalImage },
			{ name: "robots", content: "index, follow" },
		];

		const ld = {
			"@context": "https://schema.org",
			"@type": "ProfilePage",
			mainEntity: {
				"@type": "Person",
				name: user?.name ?? `@${params.username}`,
				url: pageUrl,
				image: finalImage,
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
			links: [{ rel: "canonical", href: pageUrl }],
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
				if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
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
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	const allRatings = useMemo(
		() => data?.pages.flatMap((p) => p.data || []) || [],
		[data?.pages],
	);

	if (isLoading) {
		return (
			<div>
				{[0, 1, 2, 3, 4].map((i) => (
					<div
						key={i}
						className={i === 0 ? "-mx-4" : "-mx-4 border-t border-neutral-800"}
						style={{ opacity: Math.max(0.05, 1 - i * 0.15) }}
					>
						<RatingCardSkeleton variant="rating" showImage={i % 2 === 0} />
					</div>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<div className="px-4 pt-8 pb-12 text-center text-neutral-400">
				Failed to load ratings. Please try again.
			</div>
		);
	}

	if (allRatings.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-neutral-400">{m.user_profile_no_ratings()}</p>
			</div>
		);
	}

	return (
		<>
			<div>
				{allRatings.map((rating, idx) => (
					<div
						key={rating.id}
						className={
							idx === 0
								? "-mx-4 hover:bg-neutral-800/50 transition-colors"
								: "-mx-4 border-t border-neutral-800 hover:bg-neutral-800/50 transition-colors"
						}
					>
						<div className="px-4">
							<RatingCard rating={rating} isAuthenticated={isAuthenticated} />
						</div>
					</div>
				))}
			</div>

			{isFetchingNextPage ? (
				<div className="-mx-4 border-t border-neutral-800">
					<div className="px-4 pt-8 pb-12 text-center text-sm text-neutral-400">
						Loading more...
					</div>
				</div>
			) : hasNextPage ? (
				<div ref={observerTarget} className="py-4 text-center">
					<p className="text-neutral-400 text-base">
						{m.user_profile_scroll_for_more()}
					</p>
				</div>
			) : (
				<div className="-mx-4 border-t border-neutral-800">
					<div className="px-4 pt-8 pb-12 text-center text-sm text-neutral-400">
						All caught up \(￣▽￣)/
					</div>
				</div>
			)}
		</>
	);
}

function RouteComponent() {
	const { username } = Route.useParams();
	const { data: publicUser } = useSuspenseQuery(userQueryOptions(username));
	const { data: user } = useSuspenseQuery(authQueryOptions());

	if (!publicUser) return <NotFound />;

	const ratingsCount = publicUser.ratingsCount ?? 0;
	const isOwnProfile = user?.id === publicUser.id;

	return (
		<MainLayout>
			<div className="flex items-center gap-4 m-4">
				<div>
					<div className="relative inline-block">
						<Avatar
							src={publicUser.image ?? null}
							alt={publicUser.name ?? `@${publicUser.username}`}
							size="lg"
							className="md:w-24 md:h-24"
						/>
						{isOwnProfile && (
							<Link
								to="/set-up-profile"
								search={{ redirect: `/user/${publicUser.username}` }}
								aria-label={m.menu_edit_profile()}
								title={m.menu_edit_profile()}
								className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors flex items-center justify-center shadow-md"
							>
								<Pencil className="w-3.5 h-3.5" />
							</Link>
						)}
					</div>
					{publicUser.name ? (
						<div className="baseline flex flex-row mt-2 items-baseline gap-1.5">
							<span className="text-white font-semibold text-lg">
								{publicUser.name}
							</span>
							<span className="text-neutral-400 text-md font-normal">
								(@{publicUser.username})
							</span>
						</div>
					) : (
						<div className="text-white font-semibold text-lg">
							@{publicUser.username}
						</div>
					)}
					<div className="text-neutral-400 text-base">
						{publicUser.createdAt ? (
							<>
								Joined <TimeAgo date={publicUser.createdAt} /> · {ratingsCount}{" "}
								{ratingsCount === "1" ? m.rating_singular() : m.rating_plural()}
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
