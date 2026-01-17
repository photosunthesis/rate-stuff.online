import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import * as Sentry from "@sentry/tanstackstart-react";
import { routeTree } from "~/routeTree.gen";
import { NotFound } from "~/components/ui/not-found";
import { QueryClient } from "@tanstack/react-query";
import { ErrorOccurred } from "./components/ui/error-occured";

export function getRouter() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				refetchOnWindowFocus: false,
				staleTime: 1000 * 60 * 2, // 2 minutes
			},
		},
	});

	const router = createRouter({
		routeTree,
		context: { queryClient, user: null },
		defaultPreload: "intent",
		// react-query will handle data fetching & caching
		// https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#passing-all-loader-events-to-an-external-cache
		defaultPreloadStaleTime: 0,
		defaultNotFoundComponent: NotFound,
		defaultErrorComponent: ErrorOccurred,
		scrollRestoration: true,
		defaultStructuralSharing: true,
	});

	setupRouterSsrQueryIntegration({
		router,
		queryClient,
		handleRedirects: true,
		wrapQueryClient: true,
	});

	if (!router.isServer) {
		Sentry.init({
			dsn: "https://dbf8d6e74b9a4e619283189ef0224289@ratestuffonline.bugsink.com/1",
			integrations: [],
			tracesSampleRate: 0,
			sendDefaultPii: true,
		});
	}

	return router;
}
