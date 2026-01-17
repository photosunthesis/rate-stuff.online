import { z } from "zod";

export const createRatingSchema = z
	.object({
		score: z.coerce
			.number()
			.min(1, "Score must be at least 1")
			.max(10, "Score must be at most 10"),
		content: z
			.string()
			.min(1, "Content is required")
			.max(5000, "Content must be at most 5000 characters"),
		tags: z
			.array(z.string())
			.max(5, "You can select at most 5 tags")
			.default([]),
		stuffId: z.string().optional(),
		stuffName: z.string().optional(),
		images: z
			.array(z.string())
			.max(3, "You can upload at most 3 images")
			.default([]),
	})
	.refine((data) => data.stuffId || data.stuffName, {
		message: "You must select or create something to rate",
		path: ["stuffId"],
	});

export type CreateRatingInput = z.infer<typeof createRatingSchema>;

export const stuffSearchSchema = z.object({
	query: z.string().min(1, "Search query is required"),
});
export type StuffSearchInput = z.infer<typeof stuffSearchSchema>;

export const tagSearchSchema = z.object({
	query: z.string().min(1, "Search query is required"),
});
export type TagSearchInput = z.infer<typeof tagSearchSchema>;

export const imageUploadSchema = z.object({
	file: z
		.instanceof(File, { message: "File is required" })
		.refine(
			(file) => file.size <= 5 * 1024 * 1024,
			"File size must be less than 5MB",
		)
		.refine((file) => file.type.startsWith("image/"), "File must be an image"),
});
export type ImageUploadInput = z.infer<typeof imageUploadSchema>;
