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
	email: z.string().email("Invalid email address"),
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

export type RegisterInput = z.infer<typeof registerSchema>;

export type PublicUser = {
	id: string;
	username: string;
	displayName: string | null;
	avatarUrl?: string | null;
};

export type AuthResponse =
	| { success: true; user: PublicUser }
	| { success: false; error?: string; errors?: Record<string, string> };
