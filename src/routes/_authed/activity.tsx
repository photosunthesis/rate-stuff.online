import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MainLayout } from "~/shared/components/layout/main-layout";
import { authQueryOptions } from "~/features/auth/hooks";
import {
	useSuspenseInfiniteQuery,
	useSuspenseQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useMemo } from "react";
import {
	activityListQueryOptions,
	activityKeys,
} from "~/features/activity/hooks";
import {
	markActivitiesAsReadFn,
	markActivityAsReadFn,
} from "~/features/activity/api";
import { useEffect } from "react";
import { getDateGroupLabel } from "~/shared/lib/format";
import { TimeAgo } from "~/shared/components/ui/time-ago";
import { Avatar } from "~/shared/components/ui/avatar";
import { Button } from "~/shared/components/ui/button";
import { CheckCheck } from "lucide-react";
import type { activities } from "~/infrastructure/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { getPreviewText } from "~/shared/lib/rich-text";
import { m } from "~/paraglide/messages";

type Activity = InferSelectModel<typeof activities> & {
	metadata: Record<string, unknown>;
	actor: {
		name: string | null;
		image: string | null;
		username: string | null;
	} | null;
	targetRatingId?: string | null;
	commentContent?: string | null;
};

export const Route = createFileRoute("/_authed/activity")({
	component: RouteComponent,
	beforeLoad: async ({ context }) => {
		const user = await context.queryClient.ensureQueryData({
			...authQueryOptions(),
			revalidateIfStale: true,
		});

		return { user };
	},
	loader: async ({ context }) => {
		const { user } = context;
		if (user) {
			await context.queryClient.ensureInfiniteQueryData(
				activityListQueryOptions(user.id),
			);
		}
	},
	head: () => ({
		meta: [
			{
				title: "Activity - Rate Stuff Online",
			},
			{
				name: "description",
				content:
					"View your latest notifications, upvotes, and comments from the community on Rate Stuff.",
			},
			{
				name: "robots",
				content: "noindex, nofollow",
			},
		],
	}),
});

function RouteComponent() {
	const { data: user } = useSuspenseQuery(authQueryOptions());
	const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useSuspenseInfiniteQuery(activityListQueryOptions(user?.id));
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { ref, inView } = useInView();

	useEffect(() => {
		if (inView && hasNextPage) {
			fetchNextPage();
		}
	}, [inView, fetchNextPage, hasNextPage]);

	const allActivities = useMemo(
		() => data.pages.flatMap((page) => page.items),
		[data.pages],
	);

	const groupedActivities = useMemo(() => {
		const grouped: Record<string, Activity[]> = {};

		for (const activity of allActivities) {
			const date = new Date(activity.createdAt);
			const key = getDateGroupLabel(date);

			if (!grouped[key]) grouped[key] = [];
			grouped[key].push(activity as Activity);
		}
		return grouped;
	}, [allActivities]);

	const { mutate: markAllRead, isPending: isMarkingAll } = useMutation({
		mutationFn: (userId: string) =>
			markActivitiesAsReadFn({ data: { userId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: activityKeys.unreadCounts() });
			queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
		},
	});

	const { mutate: markActivityRead } = useMutation({
		mutationFn: ({
			userId,
			activityId,
		}: {
			userId: string;
			activityId: string;
		}) => markActivityAsReadFn({ data: { userId, activityId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: activityKeys.unreadCounts() });
			queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
		},
	});

	return (
		<MainLayout>
			<div className="flex flex-col min-h-screen relative">
				{allActivities.length > 0 && (
					<div className="absolute top-4 right-4 z-10">
						<Button
							variant="secondary"
							size="sm"
							onClick={() => user?.id && markAllRead(user.id)}
							disabled={
								!user?.id ||
								isMarkingAll ||
								allActivities.every((a) => a.isRead)
							}
							className="w-auto! gap-1 flex items-center shadow-lg text-xs! font-medium!"
						>
							<CheckCheck className="w-4 h-4" />
							{m.activity_mark_all_read()}
						</Button>
					</div>
				)}
				<div className="flex flex-col flex-1 mt-4">
					{allActivities.length === 0 ? (
						<div className="flex-1 flex items-center justify-center p-8 text-center text-neutral-500">
							{m.activity_no_activity()}
						</div>
					) : (
						<>
							{Object.entries(groupedActivities).map(([dateLabel, items]) => (
								<div key={dateLabel}>
									<div className="px-4 pt-6 pb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
										{dateLabel}
									</div>
									<div>
										{items.map((activity) => (
											// biome-ignore lint/a11y/noStaticElementInteractions: Interactive card contains accessible link (Avatar)
											<div
												key={activity.id}
												className={`px-4 py-2 hover:bg-neutral-900/50 transition-colors outline-none focus-visible:bg-neutral-900/50 ${!activity.isRead ? "bg-neutral-900/60" : ""} ${activity.targetRatingId ? "cursor-pointer" : ""}`}
												onClick={() => {
													if (!activity.isRead && user?.id) {
														markActivityRead({
															userId: user.id,
															activityId: activity.id,
														});
													}

													if (activity.targetRatingId) {
														const isCommentActivity =
															activity.type === "comment_create" ||
															activity.type === "comment_vote";
														navigate({
															to: "/rating/$ratingId",
															params: { ratingId: activity.targetRatingId },
															hash: isCommentActivity
																? `comment-${activity.entityId}`
																: undefined,
														});
													}
												}}
												onKeyDown={(e) => {
													if (
														activity.targetRatingId &&
														(e.key === "Enter" || e.key === " ")
													) {
														e.preventDefault();
														const isCommentActivity =
															activity.type === "comment_create" ||
															activity.type === "comment_vote";
														navigate({
															to: "/rating/$ratingId",
															params: { ratingId: activity.targetRatingId },
															hash: isCommentActivity
																? `comment-${activity.entityId}`
																: undefined,
														});
													}
												}}
											>
												<div className="flex gap-3">
													<Avatar
														src={activity.actor?.image ?? null}
														alt={activity.actor?.name ?? "User"}
														username={activity.actor?.username ?? undefined}
													/>
													<div className="flex-1 space-y-1">
														<p className="text-base text-neutral-200">
															<span className="font-semibold text-white">
																{activity.actor?.name ??
																	activity.actor?.username ??
																	"Unknown User"}
															</span>{" "}
															{getActivityText(activity as Activity)}
														</p>
														{activity.commentContent && (
															<div className="text-sm text-neutral-400 italic line-clamp-2">
																"{getPreviewText(activity.commentContent)}"
															</div>
														)}
														<p className="text-xs text-neutral-500 mt-1">
															<TimeAgo
																date={new Date(activity.createdAt)}
																className="text-xs text-neutral-500 mt-1"
															/>
														</p>
													</div>
													{!activity.isRead && (
														<div className="h-2 w-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
													)}
												</div>
											</div>
										))}
									</div>
								</div>
							))}
							{hasNextPage && (
								<div ref={ref} className="p-4 flex justify-center">
									{isFetchingNextPage ? (
										<div className="h-6 w-6 rounded-full border-2 border-neutral-600 border-t-white animate-spin" />
									) : (
										<span className="text-base text-neutral-500">
											{m.activity_load_more()}
										</span>
									)}
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</MainLayout>
	);
}

const getActivityText = (activity: Activity) => {
	const metadata = activity.metadata;
	switch (activity.type) {
		case "rating_vote":
			return metadata?.vote === "up"
				? m.activity_upvoted_rating()
				: m.activity_downvoted_rating();
		case "comment_vote":
			return metadata?.vote === "up"
				? m.activity_upvoted_comment()
				: m.activity_downvoted_comment();
		case "comment_create":
			return m.activity_commented();
		default:
			return m.activity_generic();
	}
};
