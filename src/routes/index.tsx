import {
	createFileRoute,
	type SearchSchemaInput,
	useSearch,
} from "@tanstack/react-router";
import { MainFeed } from "~/components/layout/main-feed";
import { MainLayout } from "~/components/layout/main-layout";
import { authQueryOptions } from "~/features/auth/queries";

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
	head: ({ match }) => {
		const tag = match.search?.tag as string | undefined;
		const title = tag
			? `Ratings with the #${tag} tag - Rate Stuff Online`
			: "Rate stuff—concrete or abstract—on a scale of 1 to 10 - Rate Stuff Online";
		const description = tag
			? `Ratings tagged with #${tag}. Discover and share your thoughts on various topics with our community.`
			: "Rate and discover ratings for anything—movies, books, ideas, experiences, and more. Join our community and start rating today!";

		return {
			meta: [
				{ title },
				{ name: "description", content: description },
				{ name: "og:title", property: "og:title", content: title },
				{
					name: "og:description",
					property: "og:description",
					content: description,
				},
				{ name: "og:type", property: "og:type", content: "website" },
			],
		};
	},
});

function App() {
	const search = useSearch({ from: "/" });
	const tag = search.tag as string | undefined;
	const { user } = Route.useRouteContext();
	const currentUser = user
		? {
				id: user.id ?? "",
				username: user.username ?? "",
				name: user.name === user.username ? null : (user.name ?? null),
				image: user.image ?? undefined,
			}
		: undefined;

	return (
		<MainLayout user={currentUser} showDiscoverStrip={tag === undefined}>
			<MainFeed tag={tag} user={currentUser} />
		</MainLayout>
	);
}
