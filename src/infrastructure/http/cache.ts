import { setResponseHeader } from "@tanstack/react-start/server";

export const setPublicCacheHeader = (
	maxAgeSeconds: number = 60,
	staleWhileRevalidateSeconds: number = 600,
) => {
	setResponseHeader(
		"Cache-Control",
		`public, max-age=${maxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`,
	);
};
