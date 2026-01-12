import { createServerFn, json } from "@tanstack/react-start";
import { ZodError } from "zod";
import {
	loginSchema,
	type AuthResponse,
	type PublicUser,
	type LoginInput,
} from "~/features/sign-in/types";
import { setSessionCookie } from "~/utils/auth-utils";
import { authenticateUser } from "./service";
import {
	createRateLimitMiddleware,
	rateLimitKeys,
} from "~/middlewares/rate-limit-middleware";

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

export const loginFn = createServerFn({ method: "POST" })
	.middleware([
		createRateLimitMiddleware({
			binding: "AUTH_RATE_LIMITER",
			keyFn: rateLimitKeys.byIp,
			errorMessage: "Too many requests. Please try again after a short while.",
		}),
	])
	.inputValidator(loginSchema)
	.handler(async ({ data }): Promise<AuthResponse> => {
		try {
			const userData = await authenticateUser(data as LoginInput);

			await setSessionCookie({
				userId: userData.id,
				email: userData.email,
			});

			return { success: true, user: mapUserData(userData) };
		} catch (error) {
			if (error instanceof ZodError) {
				throw json(
					{
						success: false,
						errorMessage: "Validation failed",
						errors: formatZodError(error),
					},
					{ status: 422 },
				);
			}

			throw json(
				{
					success: false,
					errorMessage: error instanceof Error ? error.message : "Login failed",
				},
				{ status: 500 },
			);
		}
	});
