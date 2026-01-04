import { createFileRoute } from "@tanstack/react-router";
import { MainFeed } from "~/components/layout/main-feed";
import { LeftSidebar } from "~/components/layout/left-sidebar";
import { RightSidebar } from "~/components/layout/right-sidebar";
import { MobileHeader } from "~/components/layout/mobile-header";
import { mockReviews } from "~/data/mock-reviews";
import {
	useIsAuthenticated,
	isAuthenticatedQueryOptions,
} from "~/features/auth/queries";

export const Route = createFileRoute("/")({
	component: App,
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(isAuthenticatedQueryOptions());
	},
	head: () => ({
		meta: [
			{
				title:
					"Rate Stuff Online - Rate stuff—concrete or abstract—on a scale of 1 to 10",
			},
			{
				name: "description",
				content: "Rate stuff—concrete or abstract—on a scale of 1 to 10",
			},
			{
				name: "og:title",
				property: "og:title",
				content:
					"Rate Stuff Online - Rate stuff—concrete or abstract—on a scale of 1 to 10",
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
	const { isAuthenticated } = useIsAuthenticated();

	return (
		<div className="min-h-screen bg-neutral-950 flex flex-col font-sans">
			{/* Mobile Header */}
			<MobileHeader isAuthenticated={isAuthenticated} />

			<div className="flex flex-1 justify-center">
				{/* Left Sidebar */}
				<LeftSidebar />

				{/* Main Feed */}
				<MainFeed reviews={mockReviews} />

				{/* Right Sidebar */}
				<RightSidebar isAuthenticated={isAuthenticated} />
			</div>
		</div>
	);
}
