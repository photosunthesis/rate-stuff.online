import {
	createFileRoute,
	type SearchSchemaInput,
	useSearch,
} from "@tanstack/react-router";
import { MainFeed } from "~/components/layout/main-feed";
import { LeftSidebar } from "~/components/layout/left-sidebar";
import { RightSidebar } from "~/components/layout/right-sidebar";
import { MobileHeader } from "~/components/layout/mobile-header";
import { CreateRatingSection } from "~/features/create-rating/components/create-rating-section";
import {
	useIsAuthenticated,
	isAuthenticatedQueryOptions,
} from "~/features/session/queries";

export const Route = createFileRoute("/")({
	validateSearch: (search: Record<string, unknown> & SearchSchemaInput) => ({
		tag: search.tag as string | undefined,
	}),
	component: App,
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(isAuthenticatedQueryOptions());
	},
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
	const { isAuthenticated } = useIsAuthenticated();
	const search = useSearch({ from: "/" });
	const tag = search.tag as string | undefined;

	return (
		<div className="min-h-screen bg-neutral-950 flex flex-col font-sans">
			{/* Mobile Header */}
			<MobileHeader isAuthenticated={isAuthenticated} />

			<div className="flex flex-1 justify-center">
				{/* Left Sidebar */}
				<LeftSidebar />

				{/* Main Content */}
				<main className="lg:border-x border-neutral-800 w-full max-w-2xl pb-16 lg:pb-0 overflow-hidden">
					<CreateRatingSection />
					<MainFeed tag={tag} />
				</main>

				{/* Right Sidebar */}
				<RightSidebar isAuthenticated={isAuthenticated} />
			</div>
		</div>
	);
}
