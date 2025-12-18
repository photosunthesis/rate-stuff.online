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
import {
	hashPassword,
	comparePasswords,
	setSessionCookie,
	getSession,
	clearSessionCookie,
} from "~/lib/auth";
import { isRateLimited, recordAttempt, clearAttempts } from "~/lib/rateLimit";

export const registerFn = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => registerSchema.parse(data))
	.handler(async ({ data }): Promise<AuthResponse> => {
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

			await setSessionCookie({
				userId: newUser[0].id,
				email: newUser[0].email,
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
		try {
			const sessionData = await getSession();
			const userId = sessionData?.userId;

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

export const isAuthenticatedFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<boolean> => {
		try {
			const sessionData = await getSession();
			return Boolean(sessionData?.userId);
		} catch (error) {
			console.error("isAuthenticated check error:", error);
			return false;
		}
	},
);

export const loginFn = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => loginSchema.parse(data))
	.handler(async ({ data }): Promise<AuthResponse> => {
		try {
			// Check if account is locked due to too many failed attempts
			const loginKey = `login-attempt:${data.identifier}`;
			const isLimited = await isRateLimited(loginKey);
			if (isLimited) {
				return {
					success: false,
					error:
						"Account temporarily locked due to too many failed login attempts. Please try again in 15 minutes.",
					errors: {
						identifier:
							"Too many failed attempts. Account locked for 15 minutes.",
					},
				};
			}

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
				try {
					await recordAttempt(loginKey);
				} catch {
					// Error recording attempt
				}
				return {
					success: false,
					error: "Invalid credentials",
					errors: {
						identifier: "No account found with that email or username",
					},
				};
			}

			const passwordMatches = await comparePasswords(
				data.password,
				user.password || "",
			);

			if (!passwordMatches) {
				try {
					await recordAttempt(loginKey);
				} catch {
					// Error recording attempt
				}
				return {
					success: false,
					error: "Invalid credentials",
					errors: { password: "Incorrect password" },
				};
			}

			try {
				await clearAttempts(loginKey);
			} catch {
				// Error clearing attempts
			}

			await setSessionCookie({
				userId: user.id,
				email: user.email,
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

export const logoutFn = createServerFn({ method: "POST" }).handler(
	async (): Promise<{ success: boolean }> => {
		try {
			clearSessionCookie();
			return { success: true };
		} catch (error) {
			console.error("Logout error:", error);
			return { success: false };
		}
	},
);
