import { createServerFn } from "@tanstack/react-start";
import { z, ZodError } from "zod";
import { createRatingSchema } from "~/features/display-ratings/types";
import {
	createRating,
	getUploadUrl,
	searchStuff,
	searchTags,
	updateRatingImages,
} from "./service";
import {
	createRateLimitMiddleware,
	rateLimitKeys,
} from "~/features/rate-limit/middleware";
import { authMiddleware } from "../auth/middleware";

function formatZodError(error: ZodError): Record<string, string> {
	const fieldErrors: Record<string, string> = {};
	for (const issue of error.issues) {
		const key = issue.path?.length ? String(issue.path[0]) : "form";
		if (!fieldErrors[key]) fieldErrors[key] = issue.message;
	}
	return fieldErrors;
}

const rateLimitMiddleware = createRateLimitMiddleware({
	binding: "GENERAL",
	keyFn: rateLimitKeys.bySession,
	errorMessage: "Too many requests. Please try again after a short while.",
});

export const searchStuffFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware, rateLimitMiddleware])
	.inputValidator(z.object({ query: z.string() }))
	.handler(async ({ data }) => {
		try {
			const results = await searchStuff(data.query);
			return { success: true, data: results };
		} catch {
			return {
				success: true,
				data: [],
			};
		}
	});

export const searchTagsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware, rateLimitMiddleware])
	.inputValidator(z.object({ query: z.string() }))
	.handler(async ({ data }) => {
		try {
			const results = await searchTags(data.query);
			return { success: true, data: results };
		} catch {
			return {
				success: true,
				data: [],
			};
		}
	});

export const createRatingFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware, rateLimitMiddleware])
	.inputValidator(createRatingSchema)
	.handler(async ({ data, context }) => {
		try {
			const rating = await createRating(context.user.id, data);

			return { success: true, data: rating };
		} catch (error) {
			if (error instanceof ZodError)
				return {
					success: false,
					errorMessage: "Validation failed",
					errors: formatZodError(error),
				};

			return {
				success: false,
				errorMessage:
					error instanceof Error ? error.message : "Failed to create rating",
			};
		}
	});

export const getUploadUrlFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware, rateLimitMiddleware])
	.inputValidator(
		z.object({
			ratingId: z.string().min(1),
			filename: z.string().min(1),
			contentType: z.string().min(1),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const { ratingId, filename, contentType } = data;
			const result = await getUploadUrl(ratingId, filename, contentType);
			return { success: true, data: result };
		} catch (error) {
			return {
				success: false,
				errorMessage:
					error instanceof Error ? error.message : "Failed to get upload url",
			};
		}
	});

export const updateRatingImagesFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware, rateLimitMiddleware])
	.inputValidator(
		z.object({
			ratingId: z.string().min(1),
			images: z.array(z.string()).max(4, "You can upload at most 4 images"),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const result = await updateRatingImages(data.ratingId, data.images);
			return result;
		} catch (error) {
			return {
				success: false,
				errorMessage:
					error instanceof Error
						? error.message
						: "Failed to update rating images",
			};
		}
	});
