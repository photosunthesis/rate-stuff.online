import { createServerFn } from "@tanstack/react-start";
import { setPublicCacheHeader } from "~/utils/cache";
import { z, ZodError } from "zod";
import { createRatingSchema } from "../types/create";
import {
	createRating,
	getUploadUrl,
	searchStuff,
	searchTags,
	updateRatingImages,
	uploadRatingImage,
	updateRating,
	deleteRating,
} from "../services/create";
import { ALLOWED_CONTENT_TYPES } from "~/infrastructure/file-storage/service";
import { actionRateLimitMiddleware } from "~/infrastructure/rate-limit/middleware";
import { authMiddleware } from "~/domains/users/middleware";

function formatZodError(error: ZodError): Record<string, string> {
	const fieldErrors: Record<string, string> = {};
	for (const issue of error.issues) {
		const key = issue.path?.length ? String(issue.path[0]) : "form";
		if (!fieldErrors[key]) fieldErrors[key] = issue.message;
	}
	return fieldErrors;
}

export const searchStuffFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware, actionRateLimitMiddleware])
	.inputValidator(z.object({ query: z.string() }))
	.handler(async ({ data }) => {
		try {
			const results = await searchStuff(data.query);
			setPublicCacheHeader();
			return { success: true, data: results };
		} catch {
			return {
				success: true,
				data: [],
			};
		}
	});

export const searchTagsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware, actionRateLimitMiddleware])
	.inputValidator(z.object({ query: z.string() }))
	.handler(async ({ data }) => {
		try {
			const results = await searchTags(data.query);
			setPublicCacheHeader();
			return { success: true, data: results };
		} catch {
			return {
				success: true,
				data: [],
			};
		}
	});

export const createRatingFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware, actionRateLimitMiddleware])
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
	.middleware([authMiddleware, actionRateLimitMiddleware])
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

			if (!ALLOWED_CONTENT_TYPES.includes(contentType.toLowerCase())) {
				throw new Error(
					`Unsupported content type: ${contentType}. Allowed: ${ALLOWED_CONTENT_TYPES.join(", ")}`,
				);
			}

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
	.middleware([authMiddleware, actionRateLimitMiddleware])
	.inputValidator(
		z.object({
			ratingId: z.string().min(1),
			images: z.array(z.string()).max(3, "You can upload at most 3 images"),
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

export const uploadRatingImageFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware, actionRateLimitMiddleware])
	.inputValidator(
		z.preprocess(
			(val) => {
				if (!(val instanceof FormData)) return val;
				return { file: val.get("file"), ratingId: val.get("ratingId") };
			},
			z.object({
				file: z
					.instanceof(File)
					.refine(
						(f) => f.size <= 10 * 1024 * 1024,
						"File size must be less than 10MB",
					)
					.refine((f) => f.type.startsWith("image/"), "File must be an image"),
				ratingId: z.string().min(1),
			}),
		),
	)
	.handler(async ({ data }) => {
		try {
			const { file, ratingId } = data;
			const buffer = new Uint8Array(await file.arrayBuffer());
			const result = await uploadRatingImage(ratingId, buffer, file.type);

			return { success: true, url: result.url, key: result.key };
		} catch (error) {
			return {
				success: false,
				errorMessage:
					error instanceof Error ? error.message : "Failed to upload image",
			};
		}
	});

export const updateRatingFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware, actionRateLimitMiddleware])
	.inputValidator(
		z.object({
			ratingId: z.string().min(1),
			score: z.number().min(1).max(10),
			content: z.string().max(5000).optional().default(""),
			tags: z.array(z.string()).max(5).default([]),
			images: z.array(z.string()).max(3).default([]),
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const { ratingId, score, content, tags, images } = data;
			const updated = await updateRating(context.user.id, ratingId, {
				score,
				content: content || "",
				tags,
				images,
			});

			return { success: true, data: updated };
		} catch (error) {
			return {
				success: false,
				errorMessage:
					error instanceof Error ? error.message : "Failed to update rating",
			};
		}
	});

export const deleteRatingFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware, actionRateLimitMiddleware])
	.inputValidator(z.object({ ratingId: z.string().min(1) }))
	.handler(async ({ data, context }) => {
		try {
			await deleteRating(data.ratingId, context.user.id);
			return { success: true };
		} catch (error) {
			return {
				success: false,
				errorMessage:
					error instanceof Error ? error.message : "Failed to delete rating",
			};
		}
	});
