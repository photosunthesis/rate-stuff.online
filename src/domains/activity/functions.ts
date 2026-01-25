import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	authMiddleware,
	optionalAuthMiddleware,
} from "~/domains/users/middleware";
import {
	getActivities,
	getUnreadCount,
	markActivitiesAsRead,
	markActivityAsRead,
} from "./service";
import {
	generalRateLimitMiddleware,
	paginationRateLimitMiddleware,
} from "~/infrastructure/rate-limit/middleware";

export const getActivitiesFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware, paginationRateLimitMiddleware])
	.inputValidator(
		z.object({
			userId: z.string(),
			limit: z.number().default(20),
			cursor: z
				.object({
					createdAt: z.date(),
					id: z.string(),
				})
				.optional(),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const result = await getActivities(data.userId, data.limit, data.cursor);
			// Cast metadata and return safe items
			const safeItems = result.items.map((activity) => ({
				...activity,
				// biome-ignore lint/suspicious/noExplicitAny: metadata is loose json
				metadata: (activity.metadata ?? {}) as Record<string, any>,
			}));
			return {
				success: true,
				data: {
					items: safeItems,
					nextCursor: result.nextCursor,
				},
			};
		} catch (error) {
			return {
				success: false,
				errorMessage:
					error instanceof Error ? error.message : "Failed to fetch activities",
			};
		}
	});

export const getUnreadCountFn = createServerFn({ method: "GET" })
	.middleware([optionalAuthMiddleware, generalRateLimitMiddleware])
	.inputValidator(z.object({ userId: z.string() }))
	.handler(async ({ data, context }) => {
		try {
			if (!context.user) {
				return { success: true, data: 0 };
			}

			const count = await getUnreadCount(data.userId);
			return { success: true, data: count };
		} catch (error) {
			return {
				success: false,
				errorMessage:
					error instanceof Error
						? error.message
						: "Failed to fetch unread count",
			};
		}
	});

export const markActivitiesAsReadFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware, generalRateLimitMiddleware])
	.inputValidator(z.object({ userId: z.string() }))
	.handler(async ({ data }) => {
		try {
			await markActivitiesAsRead(data.userId);
			return { success: true };
		} catch (error) {
			return {
				success: false,
				errorMessage:
					error instanceof Error ? error.message : "Failed to mark as read",
			};
		}
	});

export const markActivityAsReadFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware, generalRateLimitMiddleware])
	.inputValidator(z.object({ userId: z.string(), activityId: z.string() }))
	.handler(async ({ data }) => {
		try {
			await markActivityAsRead(data.userId, data.activityId);
			return { success: true };
		} catch (error) {
			return {
				success: false,
				errorMessage:
					error instanceof Error ? error.message : "Failed to mark as read",
			};
		}
	});
