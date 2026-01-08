import { createServerFn } from "@tanstack/react-start";
import { z, ZodError } from "zod";
import { getSession } from "~/utils/auth";
import {
	createRatingSchema,
	imageUploadSchema,
} from "~/features/display-ratings/types";
import { createRating, uploadImage, searchStuff, searchTags } from "./service";

function formatZodError(error: ZodError): Record<string, string> {
	const fieldErrors: Record<string, string> = {};
	for (const issue of error.issues) {
		const key = issue.path?.length ? String(issue.path[0]) : "form";
		if (!fieldErrors[key]) fieldErrors[key] = issue.message;
	}
	return fieldErrors;
}

export const searchStuffFn = createServerFn({ method: "GET" })
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
	.inputValidator(createRatingSchema)
	.handler(async ({ data }) => {
		try {
			const session = await getSession();
			if (!session || !session.userId)
				return { success: false, error: "Unauthorized" };

			const result = await createRating(session.userId, data);
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
	.inputValidator((data: unknown) => {
		if (!(data instanceof FormData))
			throw new Error("Invalid input: expected FormData");
		const file = data.get("file");
		return imageUploadSchema.parse({ file });
	})
	.handler(async ({ data }) => {
		try {
			const session = await getSession();
			if (!session || !session.userId)
				return { success: false, error: "Unauthorized" };

			const result = await uploadImage(data.file, session.userId);
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
