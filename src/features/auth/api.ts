import { createServerFn } from "@tanstack/react-start";
import { ZodError } from "zod";
import {
	registerSchema,
	loginSchema,
	type AuthResponse,
	type User,
} from "./types";
import { setSessionCookie, getSession, clearSessionCookie } from "~/utils/auth";
import { authenticateUser, createUser, getUserById } from "./service";
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
	name: string | null;
	role: "user" | "moderator" | "admin";
	createdAt: Date;
	updatedAt: Date;
}): User {
	return {
		...userData,
		displayName: userData.name || "",
		username: userData.name || "",
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

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<User | null> => {
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
