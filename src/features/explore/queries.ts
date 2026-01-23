import { useInfiniteQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getVisualRatingsFn } from "./functions";

export const exploreKeys = {
	all: ["explore"] as const,
	feed: () => [...exploreKeys.all, "visual-feed"] as const,
};

export function useVisualRatings() {
	const getVisualRatings = useServerFn(getVisualRatingsFn);

	return useInfiniteQuery({
		queryKey: exploreKeys.feed(),
		queryFn: async ({
			pageParam,
		}: {
			pageParam?: { createdAt: Date; id: string };
		}) => {
			const res = await getVisualRatings({
				data: {
					cursor: pageParam ? pageParam : undefined,
				},
			});

			if (!res.success) {
				throw new Error(res.errorMessage ?? "Failed to load visual ratings");
			}
			return res.data;
		},
		initialPageParam: undefined as undefined | { createdAt: Date; id: string },
		getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
		staleTime: 1000 * 60 * 5,
	});
}
