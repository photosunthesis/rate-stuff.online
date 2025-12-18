import { createFileRoute } from "@tanstack/react-router";
import { MainFeed } from "~/components/layout/mainFeed";
import { Sidebar } from "~/components/layout/sidebar";
import { mockReviews } from "~/data/mock-reviews";
import { useIsAuthenticatedQuery } from "~/features/auth/queries";

export const Route = createFileRoute("/")({
	component: App,
	head: () => ({
		meta: [
			{
				title: "Rate Stuff Online - Community Ratings",
			},
			{
				name: "description",
				content: "Rate stuff—concrete or abstract—on a scale of 1 to 10",
			},
			{
				name: "og:title",
				property: "og:title",
				content: "Rate Stuff Online - Community Ratings",
			},
			{
				name: "og:description",
				property: "og:description",
				content: "Rate stuff—concrete or abstract—on a scale of 1 to 10",
			},
			{
				name: "og:type",
				property: "og:type",
				content: "website",
			},
		],
	}),
});

function App() {
	const { data: isAuthenticated = false } = useIsAuthenticatedQuery();

	const displayedReviews = isAuthenticated
		? mockReviews
		: mockReviews.slice(0, 12);

	return (
		<div className="min-h-screen bg-neutral-900 flex font-sans justify-center">
			{/* Sidebar */}
			<Sidebar isAuthenticated={isAuthenticated} />

			{/* Main Feed */}
			<MainFeed reviews={displayedReviews} isAuthenticated={isAuthenticated} />

			{/* Empty spacer to center content */}
			<div className="w-64 hidden lg:block" />
		</div>
	);
}
