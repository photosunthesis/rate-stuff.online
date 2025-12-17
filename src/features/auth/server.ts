import { createServerFn } from "@tanstack/react-start";
import { ZodError } from "zod";
import {
	registerSchema,
	loginSchema,
	type AuthResponse,
	type User,
} from "./types";
import { db } from "~/db/index";
import { users, inviteCodes } from "~/db/schema";
import { eq } from "drizzle-orm";
import { useAppSession } from "~/utils/session";
import { hash, compare } from "bcryptjs";

async function hashPassword(password: string): Promise<string> {
	return await hash(password, 12);
}

export const registerFn = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => registerSchema.parse(data))
	.handler(async ({ data }): Promise<AuthResponse> => {
		const session = await useAppSession();

		try {
			const inviteCode = await db.query.inviteCodes.findFirst({
				where: eq(inviteCodes.code, data.inviteCode),
			});

			if (!inviteCode) {
				return {
					success: false,
					error: "Invalid invite code",
					errors: { inviteCode: "This invite code does not exist" },
				};
			}

			if (inviteCode.usedBy) {
				return {
					success: false,
					error: "Invite code already used",
					errors: { inviteCode: "This invite code has already been used" },
				};
			}

			if (inviteCode.expiresAt && new Date() > new Date(inviteCode.expiresAt)) {
				return {
					success: false,
					error: "Invite code expired",
					errors: { inviteCode: "This invite code has expired" },
				};
			}

			const existingEmail = await db.query.users.findFirst({
				where: eq(users.email, data.email),
			});

			if (existingEmail) {
				return {
					success: false,
					error: "Email already registered",
					errors: { email: "This email is already registered" },
				};
			}

			const hashedPassword = await hashPassword(data.password);

			const newUser = await db
				.insert(users)
				.values({
					email: data.email,
					password: hashedPassword,
					name: data.displayName,
				})
				.returning();

			if (!newUser || newUser.length === 0) {
				return {
					success: false,
					error: "Failed to create user",
				};
			}

			await db
				.update(inviteCodes)
				.set({ usedBy: newUser[0].id, usedAt: new Date() })
				.where(eq(inviteCodes.id, inviteCode.id));

			await session.update({
				userId: newUser[0].id,
			});

			const { password: _, ...userWithoutPassword } = newUser[0];

			return {
				success: true,
				user: {
					...userWithoutPassword,
					displayName: userWithoutPassword.name || "",
					username: userWithoutPassword.name || "",
				},
			};
		} catch (error) {
			console.error("Registration error:", error);

			// If Zod validation fails, build a per-field errors map
			if (error instanceof ZodError) {
				const validationErrors: Record<string, string> = {};
				for (const issue of error.issues) {
					const key =
						issue.path && issue.path.length > 0
							? String(issue.path[0])
							: "form";
					if (!validationErrors[key]) validationErrors[key] = issue.message;
				}

				return {
					success: false,
					error: "Validation failed",
					errors: validationErrors,
				};
			}

			return {
				success: false,
				error: error instanceof Error ? error.message : "Registration failed",
			};
		}
	});

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<User | null> => {
		const session = await useAppSession();

		try {
			const userId = session.data.userId;

			if (!userId) {
				return null;
			}

			const user = await db.query.users.findFirst({
				where: eq(users.id, userId),
			});

			if (!user) {
				return null;
			}

			const { password: _, ...userWithoutPassword } = user;

			return {
				...userWithoutPassword,
				displayName: userWithoutPassword.name || "",
				username: userWithoutPassword.name || "",
			} as User;
		} catch (error) {
			console.error("Get current user error:", error);
			return null;
		}
	},
);

// Fast auth-only check that avoids a DB lookup — only checks session existence
export const isAuthenticatedFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<boolean> => {
		const session = await useAppSession();
		try {
			const userId = session.data.userId;
			return Boolean(userId);
		} catch (error) {
			console.error("isAuthenticated check error:", error);
			return false;
		}
	},
);

export const loginFn = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => loginSchema.parse(data))
	.handler(async ({ data }): Promise<AuthResponse> => {
		const session = await useAppSession();

		try {
			// Try to find by email first, then by name (username)
			let user = await db.query.users.findFirst({
				where: eq(users.email, data.identifier),
			});

			if (!user) {
				user = await db.query.users.findFirst({
					where: eq(users.name, data.identifier),
				});
			}

			if (!user) {
				return {
					success: false,
					error: "Invalid credentials",
					errors: {
						identifier: "No account found with that email or username",
					},
				};
			}

			const passwordMatches = await compare(data.password, user.password || "");

			if (!passwordMatches) {
				return {
					success: false,
					error: "Invalid credentials",
					errors: { password: "Incorrect password" },
				};
			}

			await session.update({
				userId: user.id,
			});

			const { password: _, ...userWithoutPassword } = user;

			return {
				success: true,
				user: {
					...userWithoutPassword,
					displayName: userWithoutPassword.name || "",
					username: userWithoutPassword.name || "",
				},
			};
		} catch (error) {
			console.error("Login error:", error);

			if (error instanceof ZodError) {
				const validationErrors: Record<string, string> = {};
				for (const issue of error.issues) {
					const key =
						issue.path && issue.path.length > 0
							? String(issue.path[0])
							: "form";
					if (!validationErrors[key]) validationErrors[key] = issue.message;
				}

				return {
					success: false,
					error: "Validation failed",
					errors: validationErrors,
				};
			}

			return {
				success: false,
				error: error instanceof Error ? error.message : "Login failed",
			};
		}
	});
