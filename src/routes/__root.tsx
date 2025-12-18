import type { QueryClient } from "@tanstack/react-query";

import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import TanStackQueryDevtools from "~/integrations/tanstack-query/devtools";
import appCss from "~/styles.css?url";
import { NotFound } from "~/components/ui/notFound";

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
				content: "#111827", // Tailwind bg-neutral-900
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
				<TanStackDevtools
					config={{
						hideUntilHover: true,
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
