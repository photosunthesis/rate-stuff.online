import { createServerFn } from "@tanstack/react-start";
import { getSession as getSessionUtil, clearSessionCookie } from "~/utils/auth";
import { getUserById as getUserByIdService } from "~/features/set-up-profile/service";
import type { PublicUser } from "~/features/set-up-profile/types";
import { authMiddleware } from "~/middlewares/auth-middleware";

export const getCurrentUserFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }): Promise<PublicUser | null> => {
		try {
			const userId = context.userSession.userId;

			if (!userId) return null;

			return await getUserByIdService(userId);
		} catch {
			return null;
		}
	});

export const isAuthenticatedFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<boolean> => {
		try {
			const sessionData = await getSessionUtil();
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
