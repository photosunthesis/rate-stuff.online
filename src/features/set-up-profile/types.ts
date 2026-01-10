import { z } from "zod";

export const profileSetupSchema = z.object({
	displayName: z
		.string()
		.max(50, "Display name must be at most 50 characters")
		.optional()
		.or(z.literal("")),
	avatarUrl: z.string().optional().or(z.literal("")),
});

export type ProfileSetupSchemaInput = z.infer<typeof profileSetupSchema>;

// Client-side input includes an optional File for the avatar; the server
// receives only the fields validated by `profileSetupSchema` (displayName, avatarUrl).
export type ProfileSetupInput = ProfileSetupSchemaInput & { avatar?: File };

export type PublicUser = {
	id: string;
	username: string;
	displayName: string | null;
	avatarUrl?: string | null;
	createdAt?: string | null;
	ratingsCount?: string;
};

export type UpdateProfileResponse = {
	success: boolean;
	user?: PublicUser;
	error?: string;
};
