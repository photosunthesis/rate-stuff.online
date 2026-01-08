import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { ZodError } from "zod";
import {
	registerSchema,
	loginSchema,
	profileSetupSchema,
	type AuthResponse,
	type PublicUser,
} from "./types";
import { setSessionCookie, getSession, clearSessionCookie } from "~/utils/auth";
import {
	authenticateUser,
	createUser,
	getUserById,
	updateUserProfile,
} from "./service";
import { uploadFile, getFileUrl } from "~/utils/media-storage";
import {
	createRateLimitMiddleware,
	rateLimitKeys,
} from "~/middlewares/rate-limit";

function formatZodError(error: ZodError): Record<string, string> {
	const fieldErrors: Record<string, string> = {};
	for (const issue of error.issues) {
		const key = issue.path?.length ? String(issue.path[0]) : "form";
		if (!fieldErrors[key]) {
			fieldErrors[key] = issue.message;
		}
	}
	return fieldErrors;
}

function mapUserData(userData: {
	id: string;
	email: string;
	username: string;
	name: string | null;
	avatarKey?: string | null;
	role: "user" | "moderator" | "admin";
	createdAt: Date;
	updatedAt: Date;
}): PublicUser {
	return {
		id: userData.id,
		username: userData.username,
		displayName: userData.name || null,
		avatarUrl: userData.avatarKey ? getFileUrl(userData.avatarKey) : null,
	};
}

const authRateLimit = createRateLimitMiddleware({
	binding: "AUTH_RATE_LIMITER",
	keyFn: rateLimitKeys.byIp,
	errorMessage: "Too many requests. Please try again after a short while.",
});

export const loginFn = createServerFn({ method: "POST" })
	.middleware([authRateLimit])
	.inputValidator(loginSchema)
	.handler(async ({ data }): Promise<AuthResponse> => {
		try {
			const result = await authenticateUser(data);

			if (!result.success) {
				return {
					success: false,
					error: result.error,
					errors: result.fieldErrors,
				};
			}

			await setSessionCookie({
				userId: result.data.id,
				email: result.data.email,
			});

			return {
				success: true,
				user: mapUserData(result.data),
			};
		} catch (error) {
			if (error instanceof ZodError) {
				return {
					success: false,
					error: "Validation failed",
					errors: formatZodError(error),
				};
			}

			return {
				success: false,
				error: error instanceof Error ? error.message : "Login failed",
			};
		}
	});

export const registerFn = createServerFn({ method: "POST" })
	.middleware([authRateLimit])
	.inputValidator(registerSchema)
	.handler(async ({ data }): Promise<AuthResponse> => {
		try {
			const result = await createUser(data);

			if (!result.success) {
				return {
					success: false,
					error: result.error,
					errors: result.fieldErrors,
				};
			}

			await setSessionCookie({
				userId: result.data.id,
				email: result.data.email,
			});

			return {
				success: true,
				user: mapUserData(result.data),
			};
		} catch (error) {
			if (error instanceof ZodError) {
				return {
					success: false,
					error: "Validation failed",
					errors: formatZodError(error),
				};
			}

			return {
				success: false,
				error: error instanceof Error ? error.message : "Registration failed",
			};
		}
	});

export const updateProfileFn = createServerFn({ method: "POST" })
	.inputValidator(profileSetupSchema)
	.handler(
		async ({
			data,
		}): Promise<
			| { success: boolean; user?: PublicUser; error?: string }
			| { success: false; error: string }
		> => {
			try {
				const session = await getSession();
				const userId = session?.userId;
				if (!userId) {
					return { success: false, error: "Not authenticated" };
				}

				const updates: { name?: string; avatarKey?: string } = {};

				if (data.displayName && data.displayName.trim() !== "") {
					updates.name = data.displayName;
				}

				if (data.avatarKey) {
					updates.avatarKey = data.avatarKey;
				}

				if (data.avatar) {
					if (!data.avatar.type || !data.avatar.type.startsWith("image/")) {
						throw new Error("Invalid file type. Please upload an image.");
					}
					const maxSize = 8 * 1024 * 1024;
					if ((data.avatar as File).size > maxSize) {
						throw new Error("File too large. Maximum size is 8MB.");
					}

					const origExt = data.avatar.name.split(".").pop() || "webp";
					const extension =
						data.avatar.type === "image/webp" ||
						origExt.toLowerCase() === "webp"
							? "webp"
							: origExt;
					const avatarKey = `avatars/${userId}-${Date.now()}.${extension}`;
					await uploadFile(env, avatarKey, data.avatar, {
						type: data.avatar.type,
					});
					updates.avatarKey = avatarKey;
				}

				const result = await updateUserProfile(userId, updates);
				if (!result.success) {
					return {
						success: false,
						error: result.error || "Failed to update profile",
					};
				}

				return { success: true, user: mapUserData(result.data) };
			} catch (error) {
				console.error("Error in updateProfileFn:", error);
				return {
					success: false,
					error:
						error instanceof Error ? error.message : "Failed to update profile",
				};
			}
		},
	);

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<PublicUser | null> => {
		try {
			const sessionData = await getSession();
			const userId = sessionData?.userId;

			if (!userId) {
				return null;
			}

			const userData = await getUserById(userId);

			if (!userData) {
				return null;
			}

			return mapUserData(userData);
		} catch {
			return null;
		}
	},
);

export const getProfileSummaryFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<{
		displayName: string | null;
		avatarUrl: string | null;
	} | null> => {
		try {
			const session = await getSession();
			const userId = session?.userId;
			if (!userId) return null;

			const userData = await getUserById(userId);
			if (!userData) return null;

			return {
				displayName: userData.name || null,
				avatarUrl: userData.avatarKey
					? `/api/images/${userData.avatarKey}`
					: null,
			};
		} catch {
			return null;
		}
	},
);

export const isAuthenticatedFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<boolean> => {
		try {
			const sessionData = await getSession();
			return Boolean(sessionData?.userId);
		} catch {
			return false;
		}
	},
);

export const logoutFn = createServerFn({ method: "POST" }).handler(
	async (): Promise<{ success: boolean }> => {
		try {
			clearSessionCookie();
			return { success: true };
		} catch {
			return { success: false };
		}
	},
);
