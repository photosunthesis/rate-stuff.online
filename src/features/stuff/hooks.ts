import { useInfiniteQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPaginatedStuffRatingsFn } from "./functions";
import type { StuffRating } from "./types";

type PageResult = {
	success: boolean;
	data?: StuffRating[];
	nextCursor?: string;
	error?: string;
};

export function useStuffRatingsInfinite(
	slug: string,
	limit = 10,
	enabled = true,
) {
	const getPaginatedStuffRatings = useServerFn(getPaginatedStuffRatingsFn);

	return useInfiniteQuery<
		PageResult,
		Error,
		PageResult,
		readonly ["stuff", string, "ratings", number]
	>({
		queryKey: ["stuff", slug, "ratings", limit],
		queryFn: async ({ pageParam }: { pageParam?: unknown }) => {
			const res = (await getPaginatedStuffRatings({
				data: { slug, limit, cursor: pageParam as string | undefined },
			})) as PageResult;

			if (!res.success) throw new Error(res.error ?? "Failed to load ratings");

			return res;
		},
		getNextPageParam: (lastPage: PageResult) => {
			if (!lastPage) return undefined;
			if (lastPage.success === false) return undefined;
			return lastPage.nextCursor;
		},
		initialPageParam: undefined as string | undefined,
		staleTime: 1000 * 60, // 1 minute
		gcTime: 1000 * 60 * 10,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		enabled,
	});
}
