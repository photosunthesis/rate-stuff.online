import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import appCss from "~/styles.css?url";
import { NotFound } from "~/components/ui/not-found";
import UmamiAnalytics from "@danielgtmn/umami-react";
import {
	authQueryOptions,
	type AuthQueryResult,
} from "~/features/auth/queries";
import { IKContext } from "imagekitio-react";

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
	user: AuthQueryResult;
}>()({
	beforeLoad: ({ context }) => {
		// we're using react-query for client-side caching to reduce client-to-server calls, see /src/router.tsx
		// better-auth's cookieCache is also enabled server-side to reduce server-to-db calls, see /src/lib/auth/auth.ts
		context.queryClient.prefetchQuery(authQueryOptions());

		// typically we don't need the user immediately in landing pages,
		// so we're only prefetching here and not awaiting.
	},
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
				content: "ratings, reviews, rate, ratings online, community ratings",
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
				content: "#0a0a0a",
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
				rel: "preconnect",
				href: "https://fonts.googleapis.com",
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=IBM+Plex+Mono:wght@400;700&display=swap",
			},
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
				<IKContext urlEndpoint="https://ik.imagekit.io/ratestuffonline/">
					{children}
				</IKContext>
				<UmamiAnalytics
					url="https://umami.sun-envidiado.com"
					websiteId="fff12b95-c8ad-43db-968d-587824b26d74"
				/>
				<Scripts />
			</body>
		</html>
	);
}
