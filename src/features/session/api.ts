import { createServerFn } from "@tanstack/react-start";
import {
	getSession as getSessionUtil,
	clearSessionCookie,
} from "~/utils/auth-utils";
import { getUserById as getUserByIdService } from "~/features/profile-setup/service";
import type { PublicUser } from "~/features/profile-setup/types";

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<PublicUser | null> => {
		try {
			const sessionData = await getSessionUtil();
			const userId = sessionData?.userId;

			if (!userId) return null;

			return await getUserByIdService(userId);
		} catch {
			return null;
		}
	},
);

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
