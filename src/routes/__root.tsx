import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import appCss from "~/styles.css?url";
import serifFont400 from "@fontsource/ibm-plex-serif/files/ibm-plex-serif-latin-400-normal.woff2?url";
import serifFont700 from "@fontsource/ibm-plex-serif/files/ibm-plex-serif-latin-700-normal.woff2?url";
import sansFont from "@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2?url";
import monoFont400 from "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2?url";
import { NotFound } from "~/shared/components/feedback/not-found";
import UmamiAnalytics from "@danielgtmn/umami-react";
import { authQueryOptions, type AuthQueryResult } from "~/features/auth/hooks";
import { ImageKitProvider } from "@imagekit/react";
import { AuthModalProvider } from "~/features/auth/components/auth-modal-provider";

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
				rel: "preload",
				href: sansFont,
				as: "font",
				type: "font/woff2",
				crossOrigin: "anonymous",
			},
			{
				rel: "preload",
				href: serifFont400,
				as: "font",
				type: "font/woff2",
				crossOrigin: "anonymous",
			},
			{
				rel: "preload",
				href: serifFont700,
				as: "font",
				type: "font/woff2",
				crossOrigin: "anonymous",
			},
			{
				rel: "preload",
				href: monoFont400,
				as: "font",
				type: "font/woff2",
				crossOrigin: "anonymous",
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
				<ImageKitProvider
					urlEndpoint={import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}
				>
					<AuthModalProvider>{children}</AuthModalProvider>
				</ImageKitProvider>
				<UmamiAnalytics
					url={import.meta.env.VITE_UMAMI_URL}
					websiteId={import.meta.env.VITE_UMAMI_WEBSITE_ID}
				/>
				<Scripts />
			</body>
		</html>
	);
}
