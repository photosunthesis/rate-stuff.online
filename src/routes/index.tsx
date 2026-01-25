import {
	createFileRoute,
	type SearchSchemaInput,
	useSearch,
} from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import { RouteError } from "~/components/ui/feedback/route-error";
import { RatingCardSkeleton } from "~/components/ui/content/rating-card-skeleton";
import { MainLayout } from "~/components/layout/main-layout";
import { authQueryOptions } from "~/domains/users/queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { mapToCurrentUser } from "~/domains/users/utils/user-mapping";

const MainFeed = lazy(() =>
	import("~/components/layout/main-feed").then((module) => ({
		default: module.MainFeed,
	})),
);

export const Route = createFileRoute("/")({
	beforeLoad: async ({ context }) => {
		const user = await context.queryClient.ensureQueryData({
			...authQueryOptions(),
			revalidateIfStale: true,
		});

		return { user };
	},
	validateSearch: (
		search: Record<string, string | null> & SearchSchemaInput,
	) => ({
		tag: search.tag as string | undefined,
	}),
	component: App,
	errorComponent: RouteError,
	head: ({ match }) => {
		const tag = match.search?.tag as string | undefined;
		const title = tag
			? `Ratings with the #${tag} tag - Rate Stuff Online`
			: "Rate stuff—concrete or abstract—on a scale of 1 to 10 - Rate Stuff Online";
		const description = tag
			? `Ratings tagged with #${tag}. Discover and share your thoughts on various topics with our community.`
			: "Rate and discover ratings for anything—movies, books, ideas, experiences, and more. Join our community and start rating today!";
		const canonical = tag ? `/?tag=${encodeURIComponent(tag)}` : "/";

		return {
			meta: [
				{ title },
				{ name: "description", content: description },
				{ name: "robots", content: "index, follow" },
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
				{ name: "og:type", property: "og:type", content: "website" },
				{
					name: "og:url",
					property: "og:url",
					content: `https://rate-stuff.online${canonical}`,
				},
				{ name: "twitter:card", content: "summary" },
				{ name: "twitter:title", content: title },
				{ name: "twitter:description", content: description },
			],
			links: [{ rel: "canonical", href: canonical }],
			scripts: [
				{
					type: "application/ld+json",
					children: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "WebSite",
						name: "Rate Stuff Online",
						url: "https://rate-stuff.online",
						potentialAction: {
							"@type": "SearchAction",
							target: "https://rate-stuff.online/?tag={search_term_string}",
							"query-input": "required name=search_term_string",
						},
					}),
				},
				{
					type: "application/ld+json",
					children: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "WebPage",
						name: title,
						description,
						url: `https://rate-stuff.online${canonical}`,
					}),
				},
			],
		};
	},
});

function App() {
	const search = useSearch({ from: "/" });
	const tag = search.tag as string | undefined;
	const { data: user } = useSuspenseQuery(authQueryOptions());
	const currentUser = mapToCurrentUser(user);

	return (
		<MainLayout user={currentUser} showDiscoverStrip={tag === undefined}>
			<Suspense
				fallback={
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
								<RatingCardSkeleton
									variant="rating"
									showImage={idx % 2 === 0}
								/>
							</div>
						))}
					</div>
				}
			>
				<MainFeed tag={tag} user={currentUser} />
			</Suspense>
		</MainLayout>
	);
}
