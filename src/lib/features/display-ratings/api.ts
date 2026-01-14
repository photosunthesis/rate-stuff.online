import { createServerFn, json } from "@tanstack/react-start";
import {
	getUserRatings,
	getFeedRatings,
	getRatingBySlug,
	getUserRatingsCount,
	getRatingById,
} from "./service";
import { getRecentTags, getRecentStuff } from "./service";
import { z } from "zod";
import { authMiddleware } from "~/lib/features/auth/middleware";
import { getUserByUsername } from "~/lib/features/auth/service";

function parseCursor(cursor?: string) {
	if (!cursor) return undefined;
	const [datePart, id] = cursor.split("|");
	if (!datePart || !id) return undefined;
	const createdAt = new Date(datePart);
	if (Number.isNaN(createdAt.getTime())) return undefined;
	return { createdAt, id };
}

function makeCursor(createdAt: Date | string | number, id: string) {
	return `${new Date(createdAt).toISOString()}|${id}`;
}

export const getUserRatingsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.inputValidator(
		z.object({
			limit: z.number().default(10),
			cursor: z.string().optional(),
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const cursor = parseCursor(data.cursor);
			const ratings = await getUserRatings(context.user.id, data.limit, cursor);

			let nextCursor: string | undefined;

			if (ratings.length === data.limit) {
				const last = ratings[ratings.length - 1];
				nextCursor = makeCursor(last.createdAt, last.id);
			}

			return { success: true, data: ratings, nextCursor };
		} catch (error) {
			throw json(
				{
					success: false,
					error:
						error instanceof Error ? error.message : "Failed to fetch ratings",
				},
				{
					status: 500,
				},
			);
		}
	});

export const getPublicFeedRatingsFn = createServerFn({ method: "GET" })
	.inputValidator(z.object({ tag: z.string().optional() }))
	.handler(async ({ data }) => {
		try {
			const ratings = await getFeedRatings(12, undefined, data.tag);

			// Always return the wrapped shape
			return { success: true, data: ratings, nextCursor: undefined };
		} catch (error) {
			throw json(
				{
					success: false,
					error:
						error instanceof Error ? error.message : "Failed to fetch feed",
				},
				{
					status: 500,
				},
			);
		}
	});

export const getFeedRatingsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.inputValidator(
		z.object({
			limit: z.number().default(10),
			cursor: z.string().optional(),
			tag: z.string().optional(),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const cursor = parseCursor(data.cursor);
			const ratings = await getFeedRatings(data.limit, cursor, data.tag);
			let nextCursor: string | undefined;

			if (ratings.length === data.limit) {
				const last = ratings[ratings.length - 1];
				nextCursor = makeCursor(last.createdAt, last.id);
			}

			return { success: true, data: ratings, nextCursor };
		} catch (error) {
			throw json(
				{
					success: false,
					error:
						error instanceof Error ? error.message : "Failed to fetch feed",
				},
				{
					status: 500,
				},
			);
		}
	});

export const getRatingBySlugFn = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			slug: z.string(),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const rating = await getRatingBySlug(data.slug);

			if (!rating) {
				throw json({ success: false, error: "Not found" }, { status: 404 });
			}

			return { success: true, data: rating };
		} catch (error) {
			throw json(
				{
					success: false,
					error:
						error instanceof Error ? error.message : "Failed to fetch rating",
				},
				{
					status: 500,
				},
			);
		}
	});

export const getRatingsByUsernameFn = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			username: z.string(),
			limit: z.number().optional(),
			cursor: z.string().optional(),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const user = await getUserByUsername(data.username);

			if (!user) return { success: false, error: "Not found" };

			// Limit is determined by the caller (client). Remove server-side
			// session check to avoid requiring request headers here — the
			// client passes a capped `limit` based on auth state.
			const limit = data.limit ?? 10;
			const cursor = parseCursor(data.cursor);
			const ratings = await getUserRatings(user.id, limit, cursor);

			let nextCursor: string | undefined;
			if (ratings.length === limit) {
				const last = ratings[ratings.length - 1];
				nextCursor = makeCursor(last.createdAt, last.id);
			}

			return { success: true, data: ratings, nextCursor };
		} catch (error) {
			throw json(
				{
					success: false,
					error:
						error instanceof Error ? error.message : "Failed to fetch ratings",
				},
				{
					status: 500,
				},
			);
		}
	});

export const getUserRatingsCountFn = createServerFn({ method: "GET" })
	.inputValidator(z.object({ username: z.string() }))
	.handler(async ({ data }) => {
		try {
			const user = await getUserByUsername(data.username);

			if (!user)
				throw json({ success: false, error: "Not found" }, { status: 404 });

			const count = await getUserRatingsCount(user.id);
			return { success: true, data: { count } };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to fetch ratings count",
			};
		}
	});

export const getRatingByIdFn = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			id: z.string(),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const rating = await getRatingById(data.id);

			if (!rating)
				throw json({ success: false, error: "Not found" }, { status: 404 });

			return { success: true, data: rating };
		} catch (error) {
			throw json(
				{
					success: false,
					error:
						error instanceof Error ? error.message : "Failed to fetch rating",
				},
				{
					status: 500,
				},
			);
		}
	});

export const getRecentTagsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async () => {
		try {
			const tags = await getRecentTags(10);

			return { success: true, data: tags as { name: string; count: number }[] };
		} catch (error) {
			throw json(
				{
					success: false,
					error:
						error instanceof Error ? error.message : "Failed to fetch tags",
				},
				{
					status: 500,
				},
			);
		}
	});

export const getRecentStuffFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async () => {
		try {
			const stuff = await getRecentStuff(5);
			return {
				success: true,
				data: stuff as {
					id: string;
					name: string;
					slug: string;
					count: number;
				}[],
			};
		} catch (error) {
			throw json(
				{
					success: false,
					error:
						error instanceof Error ? error.message : "Failed to fetch stuff",
				},
				{
					status: 500,
				},
			);
		}
	});
