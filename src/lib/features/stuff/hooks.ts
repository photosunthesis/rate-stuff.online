import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getStuffRatingsFn } from "./api";
import { stuffQueryOptions } from "./queries";
import type { RatingWithRelations } from "~/lib/features/display-ratings/types";

type PageResult = {
	success: boolean;
	data?: RatingWithRelations[];
	nextCursor?: string;
	error?: string;
};

export function useStuff(slug?: string) {
	return useQuery(stuffQueryOptions(slug));
}

export function useStuffRatingsInfinite(
	slug: string,
	limit = 10,
	enabled = true,
) {
	const getStuffRatings = useServerFn(getStuffRatingsFn);

	return useInfiniteQuery<
		PageResult,
		Error,
		PageResult,
		readonly ["stuff", string, "ratings"]
	>({
		queryKey: ["stuff", slug, "ratings"],
		queryFn: async ({ pageParam }: { pageParam?: unknown }) => {
			const res = (await getStuffRatings({
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
		staleTime: 0,
		gcTime: 1000 * 60 * 10,
		enabled,
	});
}
