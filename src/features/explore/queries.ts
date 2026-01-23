import { infiniteQueryOptions } from "@tanstack/react-query";
import { getVisualRatingsFn } from "./functions";

export const exploreQueries = {
	all: () => ["explore"] as const,
	infinite: () =>
		infiniteQueryOptions({
			queryKey: exploreQueries.all(),
			queryFn: ({ pageParam }) =>
				getVisualRatingsFn({
					data: {
						cursor: pageParam
							? {
									...pageParam,
									createdAt: pageParam.createdAt.toISOString(),
								}
							: undefined,
					},
				}),
			initialPageParam: undefined as
				| undefined
				| { createdAt: Date; id: string },
			getNextPageParam: (lastPage) =>
				lastPage.success ? lastPage.data.nextCursor : undefined,
			staleTime: 1000 * 60 * 5,
		}),
};
