import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getStuffBySlug, getStuffRatingsBySlug } from "./service";
import {
	generalRateLimitMiddleware,
	paginationRateLimitMiddleware,
} from "~/features/rate-limit/middleware";
import { getAuth } from "~/auth/auth.server";
import { getRequest } from "@tanstack/react-start/server";

async function getUserId() {
	try {
		const session = await getAuth().api.getSession({
			headers: getRequest().headers,
		});
		return session?.user?.id;
	} catch {
		return undefined;
	}
}

export const getStuffBySlugFn = createServerFn({ method: "GET" })
	.middleware([generalRateLimitMiddleware])
	.inputValidator(
		z.object({
			slug: z.string(),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const s = await getStuffBySlug(data.slug);
			if (!s) return { success: false, error: "Not found" };
			return { success: true, data: s };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to fetch stuff",
			};
		}
	});

export const getPaginatedStuffRatingsFn = createServerFn({ method: "GET" })
	.middleware([paginationRateLimitMiddleware])
	.inputValidator(
		z.object({
			slug: z.string(),
			limit: z.number().default(10),
			cursor: z.string().optional(),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const viewerId = await getUserId();
			const page = await getStuffRatingsBySlug(
				data.slug,
				data.limit,
				data.cursor,
				viewerId,
			);
			if (!page) return { success: false, error: "Not found" };

			return { success: true, data: page.ratings, nextCursor: page.nextCursor };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to fetch stuff ratings",
			};
		}
	});
