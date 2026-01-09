import { db } from "~/db/index";
import { users } from "~/db/schema";
import { eq } from "drizzle-orm";
import type { PublicUser } from "~/features/set-up-profile/types";
import { env } from "cloudflare:workers";
import { uploadFile } from "~/utils/media-storage-utils";
import crypto from "node:crypto";

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
			.set({ ...updates, updatedAt: new Date() })
			.where(eq(users.id, userId))
			.returning();

		if (!updatedUser || updatedUser.length === 0) {
			return { success: false, error: "Failed to update profile" };
		}

		return {
			success: true,
			data: {
				id: updatedUser[0].id,
				username: updatedUser[0].username,
				displayName: updatedUser[0].name,
				avatarUrl: updatedUser[0].avatarUrl,
			},
		};
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

export async function uploadProfileImage(
	file: File,
	userId: string,
): Promise<Result<{ key: string; url: string }>> {
	const origExt = file.name?.split(".").pop() ?? "webp";
	const extension =
		file.type === "image/webp" || origExt.toLowerCase() === "webp"
			? "webp"
			: origExt;
	const key = `avatars/${userId}/${crypto.randomUUID()}.${extension}`;

	try {
		const url = await uploadFile(env, key, file);

		return { success: true, data: { key, url } };
	} catch {
		return { success: false, error: "Failed to upload image" };
	}
}
