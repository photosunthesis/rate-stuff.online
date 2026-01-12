import { createServerFn, json } from "@tanstack/react-start";
import { ZodError } from "zod";
import {
	registerSchema,
	type PublicUser,
	type RegisterInput,
} from "~/features/create-account/types";
import { setSessionCookie } from "~/utils/auth-utils";
import { createUser } from "./service";
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

const authRateLimit = createRateLimitMiddleware({
	binding: "AUTH_RATE_LIMITER",
	keyFn: rateLimitKeys.byIp,
	errorMessage: "Too many requests. Please try again after a short while.",
});

export const registerFn = createServerFn({ method: "POST" })
	.middleware([authRateLimit])
	.inputValidator(registerSchema)
	.handler(async ({ data }) => {
		try {
			const userData = await createUser(data as RegisterInput);

			await setSessionCookie({
				userId: userData.id,
				email: userData.email,
			});

			return { success: true, user: mapUserData(userData) };
		} catch (error) {
			if (error instanceof ZodError)
				throw json(
					{
						success: false,
						errorMessage: "Validation failed",
						errors: formatZodError(error),
					},
					{ status: 422 },
				);

			throw json(
				{
					success: false,
					errorMessage:
						error instanceof Error ? error.message : "Registration failed",
				},
				{ status: 500 },
			);
		}
	});
