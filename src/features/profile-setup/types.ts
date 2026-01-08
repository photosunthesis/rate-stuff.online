import { z } from "zod";

export const profileSetupSchema = z.object({
	displayName: z
		.string()
		.max(50, "Display name must be at most 50 characters")
		.optional()
		.or(z.literal("")),
	avatar: z.instanceof(File).optional(),
	avatarUrl: z.string().optional().or(z.literal("")),
});

export type ProfileSetupInput = z.infer<typeof profileSetupSchema>;

export type PublicUser = {
	id: string;
	username: string;
	displayName: string | null;
	avatarUrl?: string | null;
};

export type UpdateProfileResponse = {
	success: boolean;
	user?: PublicUser;
	error?: string;
};
