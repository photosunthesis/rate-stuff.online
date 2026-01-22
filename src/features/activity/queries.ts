import { queryOptions, infiniteQueryOptions } from "@tanstack/react-query";
import { getActivitiesFn, getUnreadCountFn } from "./functions";

export const activityKeys = {
	all: ["activities"] as const,
	lists: () => [...activityKeys.all, "list"] as const,
	list: (userId: string) => [...activityKeys.lists(), userId] as const,
	unreadCounts: () => [...activityKeys.all, "unread"] as const,
	unreadCount: (userId: string) =>
		[...activityKeys.unreadCounts(), userId] as const,
};

export const activityListQueryOptions = (userId?: string) =>
	infiniteQueryOptions({
		queryKey: userId ? activityKeys.list(userId) : activityKeys.all,
		queryFn: async ({ queryKey, pageParam }) => {
			const uId = queryKey[2];
			if (!uId) throw new Error("User ID required");
			const res = await getActivitiesFn({
				data: {
					userId: uId,
					cursor: pageParam as { createdAt: Date; id: string } | undefined,
				},
			});
			if (!res.success) {
				throw new Error(res.errorMessage || "Failed to fetch activities");
			}
			return res.data;
		},
		initialPageParam: undefined as { createdAt: Date; id: string } | undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor,
		enabled: !!userId,
	});

export const unreadActivityCountQueryOptions = (userId?: string) =>
	queryOptions({
		queryKey: userId
			? activityKeys.unreadCount(userId)
			: ["activities", "unread", "anon"],
		queryFn: async ({ queryKey }) => {
			const uId = queryKey[2];
			if (!uId || uId === "anon") return 0;
			const res = await getUnreadCountFn({ data: { userId: uId } });
			if (!res.success) {
				throw new Error(res.errorMessage || "Failed to fetch unread count");
			}
			return res.data;
		},
		enabled: !!userId,
		refetchInterval: 60 * 1000,
	});
