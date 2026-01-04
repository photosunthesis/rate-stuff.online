import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import appCss from "~/styles.css?url";
import { NotFound } from "~/components/not-found";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	notFoundComponent: NotFound,
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				name: "description",
				content: "Rate stuff—concrete or abstract—on a scale of 1 to 10",
			},
			{
				name: "keywords",
				content: "ratings, reviews, rate, reviews online, community ratings",
			},
			{
				name: "author",
				content: "Rate Stuff Online",
			},
			{
				name: "theme-color",
				content: "#0a0a0a", // Tailwind bg-neutral-950
			},
			{
				name: "apple-mobile-web-app-capable",
				content: "yes",
			},
			{
				name: "apple-mobile-web-app-status-bar-style",
				content: "black-translucent",
			},
			{
				name: "mobile-web-app-capable",
				content: "yes",
			},
			{
				name: "msapplication-TileColor",
				content: "#111827",
			},
			{
				property: "og:title",
				content: "Rate Stuff Online - Discover Community Ratings",
			},
			{
				property: "og:description",
				content: "Rate stuff—concrete or abstract—on a scale of 1 to 10",
			},
			{
				property: "og:type",
				content: "website",
			},
			{
				name: "twitter:card",
				content: "summary_large_image",
			},
			{
				name: "twitter:title",
				content: "Rate Stuff Online",
			},
			{
				name: "twitter:description",
				content: "Rate stuff—concrete or abstract—on a scale of 1 to 10",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),

	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}
