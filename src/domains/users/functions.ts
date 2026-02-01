import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generalRateLimitMiddleware } from "~/infrastructure/rate-limit/middleware";
import { authMiddleware } from "~/domains/users/middleware";
import {
	getUserByUsername as getUserByUsernameService,
	uploadProfileImage,
	getEmailForUnverifiedUser,
} from "./service";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { getAuth } from "~/domains/users/auth/server";

export const uploadAvatarFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware, generalRateLimitMiddleware])
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
						(f) => f.size <= 10 * 1024 * 1024,
						"File size must be less than 10MB",
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
	.middleware([generalRateLimitMiddleware])
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

export const getEmailForUnverifiedUserFn = createServerFn({ method: "GET" })
	.middleware([generalRateLimitMiddleware])
	.inputValidator(
		z.object({ username: z.string().optional(), email: z.string().optional() }),
	)
	.handler(async ({ data }) => {
		try {
			const email = await getEmailForUnverifiedUser(data);

			if (!email) return { success: false };

			return { success: true, email };
		} catch (_) {
			return { success: false };
		}
	});

export const getCurrentUserFn = createServerFn({ method: "GET" })
	.middleware([generalRateLimitMiddleware])
	.handler(async () => {
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
	});
