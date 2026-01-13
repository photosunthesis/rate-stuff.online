import { z } from "zod";

export const registerBaseSchema = z.object({
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
});

export type RegisterBaseInput = z.infer<typeof registerBaseSchema>;

export const registerSchema = registerBaseSchema
	.extend({
		confirmPassword: z.string().min(1, "Please confirm your password"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
	identifier: z.string().min(1, "Email or username is required"),
	password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

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
