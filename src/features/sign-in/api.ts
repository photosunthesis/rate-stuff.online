import { createServerFn } from "@tanstack/react-start";
import { ZodError } from "zod";
import {
	loginSchema,
	type AuthResponse,
	type PublicUser,
	type LoginInput,
} from "~/features/sign-in/types";
import { setSessionCookie } from "~/utils/auth";
import { authenticateUser } from "./service";
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
	username: string;
	name?: string | null;
	avatarUrl?: string | null;
}): PublicUser {
	return {
		id: userData.id,
		username: userData.username,
		displayName: userData.name || null,
		avatarUrl: userData.avatarUrl ?? null,
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
			const result = await authenticateUser(data as LoginInput);

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

			return { success: true, user: mapUserData(result.data) };
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
