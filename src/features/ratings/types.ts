import { z } from "zod";

export type Stuff = {
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
};

export type Tag = {
	id: string;
	name: string;
	createdAt: string;
};

export type Rating = {
	id: string;
	userId: string;
	stuffId: string;
	title: string;
	score: number;
	content: string;
	images: string | null;
	createdAt: string;
	updatedAt: string;
};

export const createRatingSchema = z
	.object({
		title: z
			.string()
			.min(1, "Title is required")
			.max(200, "Title must be at most 200 characters"),
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
			.max(10, "You can select at most 10 tags")
			.default([]),
		stuffId: z.string().optional(),
		stuffName: z.string().optional(),
		images: z.array(z.string()).default([]),
	})
	.refine((data) => data.stuffId || data.stuffName, {
		message: "You must select or create something to rate",
		path: ["stuffId"],
	});

export type CreateRatingInput = z.infer<typeof createRatingSchema>;

export const stuffSearchSchema = z.object({
	query: z.string().min(1, "Search query is required"),
});

export const tagSearchSchema = z.object({
	query: z.string().min(1, "Search query is required"),
});

export type ValidationErrors = Record<string, string>;

export type RatingResponse =
	| { success: true; rating: Rating }
	| { success: false; error: string; errors?: ValidationErrors };

export type StuffSearchResponse =
	| { success: true; stuff: Stuff[] }
	| { success: false; error: string };

export type TagSearchResponse =
	| { success: true; tags: Tag[] }
	| { success: false; error: string };

export type ImageUploadResponse =
	| { success: true; key: string; url: string }
	| { success: false; error: string };

export const imageUploadSchema = z.object({
	file: z
		.instanceof(File, { message: "File is required" })
		.refine(
			(file) => file.size <= 5 * 1024 * 1024,
			"File size must be less than 5MB",
		)
		.refine((file) => file.type.startsWith("image/"), "File must be an image"),
});
