import { createServerFn } from "@tanstack/react-start";
import { getSession as getSessionUtil, clearSessionCookie } from "~/utils/auth";
import { getUserById as getUserByIdService } from "~/features/profile-setup/service";
import type { PublicUser } from "~/features/profile-setup/types";

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

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<PublicUser | null> => {
		try {
			const sessionData = await getSessionUtil();
			const userId = sessionData?.userId;
			if (!userId) return null;
			const userData = await getUserByIdService(userId);
			if (!userData) return null;
			return mapUserData(userData);
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
