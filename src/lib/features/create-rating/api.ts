import { createServerFn, json } from "@tanstack/react-start";
import { z, ZodError } from "zod";
import { createRatingSchema } from "~/lib/features/display-ratings/types";
import {
	createRating,
	uploadImage,
	searchStuff,
	searchTags,
	updateRatingImages,
} from "./service";
import {
	createRateLimitMiddleware,
	rateLimitKeys,
} from "~/lib/rate-limit/middleware";
import { authMiddleware } from "~/lib/auth/middleware";

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
				throw json(
					{
						success: false,
						errorMessage: "Validation failed",
						errors: formatZodError(error),
					},
					{
						status: 422,
					},
				);

			throw json(
				{
					success: false,
					errorMessage:
						error instanceof Error ? error.message : "Failed to create rating",
				},
				{ status: 500 },
			);
		}
	});

export const uploadImageFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware, rateLimitMiddleware])
	.inputValidator(
		z.preprocess(
			(val) => {
				if (!(val instanceof FormData)) return val;
				return {
					file: val.get("file"),
					ratingId: val.get("ratingId"),
				};
			},
			z.object({
				file: z
					.instanceof(File)
					.refine(
						(f) => f.size <= 5 * 1024 * 1024,
						"File size must be less than 5MB",
					)
					.refine((f) => f.type.startsWith("image/"), "File must be an image"),
				ratingId: z.string().min(1, "ratingId is required"),
			}),
		),
	)
	.handler(async ({ data }) => {
		try {
			const result = await uploadImage(data.file, data.ratingId);
			return result;
		} catch (error) {
			if (error instanceof ZodError)
				throw json(
					{
						success: false,
						errorMessage: "Validation failed",
						errors: formatZodError(error),
					},
					{ status: 422 },
				);

			throw json(
				{
					success: false,
					errorMessage:
						error instanceof Error ? error.message : "Image upload failed",
				},
				{ status: 500 },
			);
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
			return json(
				{
					success: false,
					errorMessage:
						error instanceof Error
							? error.message
							: "Failed to update rating images",
				},
				{ status: 500 },
			);
		}
	});
