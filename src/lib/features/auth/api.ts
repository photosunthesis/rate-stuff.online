import { createServerFn } from "@tanstack/react-start";
import { isEmail } from "~/lib/utils/strings";
import { z } from "zod";
import {
	createRateLimitMiddleware,
	RATE_LIMITER_BINDING,
	rateLimitKeys,
} from "~/lib/features/rate-limit/middleware";
import { authMiddleware } from "~/lib/features/auth/middleware";
import {
	getUserByUsername as getUserByUsernameService,
	markInviteCodeAsUsed,
	uploadProfileImage,
	validateInviteCode,
} from "./service";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { auth } from "../../core/auth";

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
	.middleware([authMiddleware])
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

export const signInFn = createServerFn({ method: "POST" })
	.middleware([
		createRateLimitMiddleware({
			binding: RATE_LIMITER_BINDING.AUTH,
			keyFn: rateLimitKeys.byIp,
			errorMessage: "Too many sign-in attempts. Please try again later.",
		}),
	])
	.inputValidator(
		z.object({
			identifier: z.string().min(1),
			password: z.string().min(1),
		}),
	)
	.handler(async ({ data }) => {
		try {
			isEmail(data.identifier)
				? await auth.api.signInEmail({
						body: {
							email: data.identifier,
							password: data.password,
						},
					})
				: await auth.api.signInUsername({
						body: {
							username: data.identifier,
							password: data.password,
						},
					});

			return {
				success: true,
			};
		} catch (error) {
			return {
				success: false,
				errorMessage: error instanceof Error ? error.message : "Sign-in failed",
			};
		}
	});

export const updateUserProfileFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator(
		z.object({
			name: z.string().min(1).max(50).optional(),
			image: z.url().optional(),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const payload: { name?: string; image?: string } = {};

			if (data.name) payload.name = data.name;
			if (data.image) payload.image = data.image;

			await auth.api.updateUser({
				body: payload,
			});

			return {
				success: true,
			};
		} catch (error) {
			return {
				success: false,
				errorMessage:
					error instanceof Error ? error.message : "Profile update failed",
			};
		}
	});

export const uploadAvatarFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
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
		const session = await auth.api.getSession({
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
