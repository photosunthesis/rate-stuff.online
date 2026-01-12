import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "~/routeTree.gen";
import { NotFound } from "~/components/not-found";
import { QueryClient } from "@tanstack/react-query";

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
		scrollRestoration: true,
		defaultStructuralSharing: true,
	});

	setupRouterSsrQueryIntegration({
		router,
		queryClient,
		handleRedirects: true,
		wrapQueryClient: true,
	});

	return router;
}
