import { db } from "~/db/index";
import { users } from "~/db/schema";
import { eq } from "drizzle-orm";
import type { PublicUser } from "~/features/profile-setup/types";

type Result<T> =
	| { success: true; data: T }
	| { success: false; error: string; fieldErrors?: Record<string, string> };

export async function updateUserProfile(
	userId: string,
	updates: { name?: string; avatarUrl?: string | null },
): Promise<Result<PublicUser>> {
	try {
		const updatedUser = await db
			.update(users)
			.set({ ...updates, updatedAt: new Date().toISOString() })
			.where(eq(users.id, userId))
			.returning();

		if (!updatedUser || updatedUser.length === 0) {
			return { success: false, error: "Failed to update profile" };
		}

		const publicUser: PublicUser = {
			id: updatedUser[0].id,
			username: updatedUser[0].username,
			displayName: updatedUser[0].name,
			avatarUrl: updatedUser[0].avatarUrl,
		};
		return { success: true, data: publicUser };
	} catch {
		return { success: false, error: "Failed to update profile" };
	}
}

export async function getUserById(userId: string): Promise<PublicUser | null> {
	const user = await db.query.users.findFirst({ where: eq(users.id, userId) });

	if (!user) return null;

	return {
		id: user.id,
		username: user.username,
		displayName: user.name,
		avatarUrl: user.avatarUrl,
	};
}
