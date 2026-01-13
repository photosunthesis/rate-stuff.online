import {
	createFileRoute,
	type SearchSchemaInput,
	useSearch,
} from "@tanstack/react-router";
import { MainFeed } from "~/components/layout/main-feed";
import { MainLayout } from "~/components/layout/main-layout";
import { authQueryOptions } from "~/lib/auth/queries";

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
			: "Rate Stuff Online - Rate stuff—concrete or abstract—on a scale of 1 to 10";
		const description = tag
			? `Ratings tagged with #${tag}`
			: "Rate stuff—concrete or abstract—on a scale of 1 to 10";

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
	const { user } = Route.useRouteContext();
	const search = useSearch({ from: "/" });
	const tag = search.tag as string | undefined;

	return (
		<MainLayout
			user={
				user
					? {
							username: user?.username ?? "",
							name: user?.name,
							image: user?.image ?? "",
						}
					: undefined
			}
		>
			<MainFeed tag={tag} user={{ username: user?.username ?? "" }} />
		</MainLayout>
	);
}
