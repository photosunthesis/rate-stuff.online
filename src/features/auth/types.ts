import { z } from "zod";

const registerBaseSchema = z.object({
	inviteCode: z.string().min(1, "Invite code is required"),
	username: z
		.string()
		.min(3, "Username must be at least 3 characters")
		.max(20, "Username must be at most 20 characters")
		.regex(
			/^[a-zA-Z0-9_-]+$/,
			"Username can only contain letters, numbers, underscores, and hyphens",
		),

	email: z.email("Invalid email address"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/[0-9]/, "Password must contain at least one number"),
	confirmPassword: z.string(),
});

export const registerSchema = registerBaseSchema.refine(
	(data) => data.password === data.confirmPassword,
	{
		message: "Passwords do not match",
		path: ["confirmPassword"],
	},
);

export const loginSchema = z.object({
	identifier: z.string().min(1, "Email or username is required"),
	password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type User = {
	id: string;
	email: string;
	username: string;
	displayName: string | null;
	avatarKey?: string | null;
	avatarUrl?: string | null;
	role: "user" | "moderator" | "admin";
	createdAt: Date;
	updatedAt: Date;
};

export type PublicUser = {
	id: string;
	username: string;
	displayName: string | null;
	avatarUrl?: string | null;
};

export const profileSetupSchema = z.object({
	displayName: z
		.string()
		.max(50, "Display name must be at most 50 characters")
		.optional()
		.or(z.literal("")),
	// Accept either a File (for uploads) or an avatar key string (for existing uploads)
	avatar: z.instanceof(File).optional(),
	avatarKey: z.string().optional(),
});

export type ProfileSetupInput = z.infer<typeof profileSetupSchema>;

export type ValidationErrors = Record<string, string>;

export type ProfileSummary = {
	displayName: string | null;
	avatarUrl: string | null;
} | null;

export type UpdateProfileResponse = {
	success: boolean;
	user?: PublicUser;
	error?: string;
};

export type AuthResponse =
	| { success: true; user: PublicUser }
	| { success: false; error?: string; errors?: ValidationErrors };
