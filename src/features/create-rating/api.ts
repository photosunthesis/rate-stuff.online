import { createServerFn } from "@tanstack/react-start";
import { z, ZodError } from "zod";
import {
	createRatingSchema,
	imageUploadSchema,
} from "~/features/display-ratings/types";
import { createRating, uploadImage, searchStuff, searchTags } from "./service";
import {
	createRateLimitMiddleware,
	rateLimitKeys,
} from "~/middlewares/rate-limit-middleware";
import { authMiddleware } from "~/middlewares/auth-middleware";

function formatZodError(error: ZodError): Record<string, string> {
	const fieldErrors: Record<string, string> = {};
	for (const issue of error.issues) {
		const key = issue.path?.length ? String(issue.path[0]) : "form";
		if (!fieldErrors[key]) fieldErrors[key] = issue.message;
	}
	return fieldErrors;
}

const rateLimitMiddleware = createRateLimitMiddleware({
	binding: "GENERAL_RATE_LIMITER",
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
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Search failed",
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
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Search failed",
			};
		}
	});

export const createRatingFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware, rateLimitMiddleware])
	.inputValidator(createRatingSchema)
	.handler(async ({ data, context }) => {
		try {
			const result = await createRating(context.userSession.userId, data);
			if (!result.success)
				return {
					success: false,
					error: result.error,
					fieldErrors: result.fieldErrors,
				};

			return { success: true, data: result.data };
		} catch (error) {
			if (error instanceof ZodError)
				return {
					success: false,
					error: "Validation failed",
					fieldErrors: formatZodError(error),
				};
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to create rating",
			};
		}
	});

export const uploadImageFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware, rateLimitMiddleware])
	.inputValidator((data: unknown) => {
		if (!(data instanceof FormData))
			throw new Error("Invalid input: expected FormData");
		const file = data.get("file");
		return imageUploadSchema.parse({ file });
	})
	.handler(async ({ data, context }) => {
		try {
			const result = await uploadImage(data.file, context.userSession.userId);
			return result;
		} catch (error) {
			if (error instanceof ZodError)
				return {
					success: false,
					error: "Validation failed",
					fieldErrors: formatZodError(error),
				};
			return {
				success: false,
				error: error instanceof Error ? error.message : "Upload failed",
			};
		}
	});
