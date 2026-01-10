import { queryOptions } from "@tanstack/react-query";
import { getStuffBySlugFn, getStuffRatingsFn } from "./api";
import type { StuffWithAggregates } from "./types";

export const stuffKeys = {
	all: ["stuff"] as const,
	detail: (slug: string) => [...stuffKeys.all, slug] as const,
	ratings: (slug: string) => [...stuffKeys.detail(slug), "ratings"] as const,
};

export const stuffQueryOptions = (slug?: string) =>
	queryOptions({
		queryKey: slug ? stuffKeys.detail(slug) : ["stuff", undefined],
		queryFn: async () => {
			if (!slug) return null;
			const res = (await getStuffBySlugFn({ data: { slug } })) as {
				success: boolean;
				data?: StuffWithAggregates | null;
				error?: string;
			};
			if (!res.success) throw new Error(res.error ?? "Failed to load stuff");
			return res.data ?? null;
		},
		staleTime: 0,
		gcTime: 1000 * 60 * 10,
	});

export const stuffRatingsInfiniteQueryOptions = (slug: string, limit = 10) =>
	queryOptions({
		queryKey: stuffKeys.ratings(slug),
		queryFn: async ({ pageParam }: { pageParam?: unknown }) => {
			const res = (await getStuffRatingsFn({
				data: { slug, limit, cursor: pageParam as string | undefined },
			})) as {
				success: boolean;
				data?: unknown[];
				nextCursor?: string;
				error?: string;
			};
			if (!res.success)
				throw new Error(res.error ?? "Failed to load stuff ratings");
			return {
				success: true,
				data: res.data ?? [],
				nextCursor: res.nextCursor,
			};
		},
		staleTime: 0,
		gcTime: 1000 * 60 * 10,
	});
