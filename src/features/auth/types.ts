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
	displayName: z
		.string()
		.min(1, "Display name is required")
		.max(50, "Display name must be at most 50 characters"),
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

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
	identifier: z.string().min(1, "Email or username is required"),
	password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export interface User {
	id: string;
	email: string;
	username?: string;
	displayName?: string;
	role: "user" | "moderator" | "admin";
	createdAt: Date;
	updatedAt: Date;
}

export interface ValidationErrors {
	[field: string]: string;
}

export interface AuthResponse {
	success: boolean;
	user?: User;
	error?: string; // Global error message
	errors?: ValidationErrors; // Field-level errors
}

export class AuthError extends Error {
	constructor(
		message: string,
		public validationErrors: ValidationErrors = {},
		public statusCode: number = 400,
	) {
		super(message);
		this.name = "AuthError";
	}

	static fromResponse(response: AuthResponse): AuthError {
		return new AuthError(
			response.error || "Authentication failed",
			response.errors || {},
		);
	}
}

export interface UseRegisterReturn {
	register: (data: RegisterInput) => Promise<void>;
	isPending: boolean;
	isError: boolean;
	errorMessage: string | null;
	validationErrors: ValidationErrors;
	reset: () => void;
}
