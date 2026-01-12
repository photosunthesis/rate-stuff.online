import { z } from "zod";

export const profileSetupSchema = z.object({
	name: z
		.string()
		.max(50, "Display name must be at most 50 characters")
		.optional()
		.or(z.literal("")),
	image: z.string().optional().or(z.literal("")),
});

export type SetUpProfileSchemaInput = z.infer<typeof profileSetupSchema>;

// Client-side input includes an optional File for the avatar; the server
// receives only the fields validated by `profileSetupSchema` (name, image).
export type SetUpProfileInput = SetUpProfileSchemaInput & { avatar?: File };

export type PublicUser = {
	id: string;
	username: string;
	name: string | null;
	image?: string | null;
	createdAt?: string | null;
	ratingsCount?: string;
};
