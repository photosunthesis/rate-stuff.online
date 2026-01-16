import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	createRateLimitMiddleware,
	RATE_LIMITER_BINDING,
	rateLimitKeys,
} from "~/features/rate-limit/middleware";
import { authMiddleware } from "~/features/auth/middleware";
import {
	getUserByUsername as getUserByUsernameService,
	markInviteCodeAsUsed,
	uploadProfileImage,
	validateInviteCode,
} from "./service";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { getAuth } from "~/auth/auth.server";

export const validateInviteCodeFn = createServerFn({ method: "POST" })
	.middleware([
		createRateLimitMiddleware({
			binding: RATE_LIMITER_BINDING.GENERAL,
			keyFn: rateLimitKeys.byIp,
			errorMessage: "Too many requests. Please try again later.",
		}),
	])
	.inputValidator(z.object({ inviteCode: z.string().min(1) }))
	.handler(async ({ data }) => {
		try {
			const isValid = await validateInviteCode(data.inviteCode);
			return { success: isValid };
		} catch (error) {
			return {
				success: false,
				errorMessage:
					error instanceof Error ? error.message : "Validation failed",
			};
		}
	});

export const markInviteCodeAsUsedFn = createServerFn({ method: "POST" })
	.middleware([
		authMiddleware,
		createRateLimitMiddleware({
			binding: RATE_LIMITER_BINDING.GENERAL,
			keyFn: rateLimitKeys.bySession,
			errorMessage: "Too many requests. Please try again later.",
		}),
	])
	.inputValidator(z.object({ inviteCode: z.string().min(1) }))
	.handler(async ({ data, context }) => {
		try {
			await markInviteCodeAsUsed(data.inviteCode, context.user.id);
			return { success: true };
		} catch (error) {
			return {
				success: false,
				errorMessage:
					error instanceof Error ? error.message : "Operation failed",
			};
		}
	});

export const uploadAvatarFn = createServerFn({ method: "POST" })
	.middleware([
		authMiddleware,
		createRateLimitMiddleware({
			binding: RATE_LIMITER_BINDING.GENERAL,
			keyFn: rateLimitKeys.bySession,
			errorMessage: "Too many requests. Please try again later.",
		}),
	])
	.inputValidator(
		z.preprocess(
			(val) => {
				if (!(val instanceof FormData)) return val;
				return { file: val.get("file") };
			},
			z.object({
				file: z
					.instanceof(File)
					.refine(
						(f) => f.size <= 5 * 1024 * 1024,
						"File size must be less than 5MB",
					)
					.refine((f) => f.type.startsWith("image/"), "File must be an image"),
			}),
		),
	)
	.handler(async ({ data, context }) => {
		try {
			const result = await uploadProfileImage(data.file, context.user.id);

			return {
				success: true,
				url: result.url,
			};
		} catch (error) {
			return {
				success: false,
				errorMessage:
					error instanceof Error ? error.message : "Failed to upload avatar",
			};
		}
	});

export const getUserByUsernameFn = createServerFn({ method: "GET" })
	.inputValidator(z.object({ username: z.string() }))
	.handler(async ({ data }) => {
		try {
			const user = await getUserByUsernameService(data.username);

			if (!user)
				return {
					success: false,
					errorMessage: "User not found",
				};

			return { success: true, data: user };
		} catch (error) {
			return {
				success: false,
				errorMessage:
					error instanceof Error ? error.message : "Failed to get user",
			};
		}
	});

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const session = await getAuth().api.getSession({
			headers: getRequest().headers,
			returnHeaders: true,
		});

		// Forward any Set-Cookie headers to the client, e.g. for session/cache refresh
		const cookies = session.headers?.getSetCookie();
		if (cookies?.length) {
			setResponseHeader("Set-Cookie", cookies);
		}

		return session.response?.user || null;
	},
);
