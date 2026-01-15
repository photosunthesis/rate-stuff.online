import { z } from "zod";
import type { ratings, stuff } from "~/db/schema";

export type Stuff = typeof stuff.$inferSelect;

export type Tag = {
	id: string;
	name: string;
	createdAt: Date;
};

export type RatingWithRelations = typeof ratings.$inferSelect & {
	tags: string[];
	user: {
		id: string;
		name: string | null;
		username: string | null;
		image: string | null;
	} | null;
	stuff: typeof stuff.$inferSelect | null;
};

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
			.max(4, "You can upload at most 4 images")
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
export const tagSearchSchema = z.object({
	query: z.string().min(1, "Search query is required"),
});
