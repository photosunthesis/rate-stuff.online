import { z } from "zod";

export const loginSchema = z.object({
	identifier: z.string().min(1, "Email or username is required"),
	password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export type PublicUser = {
	id: string;
	username: string;
	displayName: string | null;
	avatarUrl?: string | null;
};

export type AuthResponse =
	| { success: true; user: PublicUser }
	| { success: false; error?: string; errors?: Record<string, string> };
