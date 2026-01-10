import { db } from "~/db/index";
import { users, ratings } from "~/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import type { PublicUser } from "~/features/set-up-profile/types";
import { env } from "cloudflare:workers";
import { uploadFile } from "~/utils/media-storage-utils";
import { numberWithCommas } from "~/utils/number-utils";
import { safeRandomUUID } from "~/utils/uuid-utils";

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

export async function getUserByUsername(
	username: string,
): Promise<(PublicUser & { createdAt?: string | null }) | null> {
	const user = await db.query.users.findFirst({
		where: eq(users.username, username),
	});

	if (!user) return null;

	// Count user's non-deleted ratings
	const rows = await db
		.select({ count: sql`COUNT(*)` })
		.from(ratings)
		.where(and(eq(ratings.userId, user.id), isNull(ratings.deletedAt)));

	const ratingsCount = rows && rows.length > 0 ? Number(rows[0].count) : 0;

	return {
		id: user.id,
		username: user.username,
		displayName: user.name,
		avatarUrl: user.avatarUrl,
		createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
		ratingsCount: numberWithCommas(ratingsCount),
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
	const key = `avatars/${userId}/${safeRandomUUID()}.${extension}`;

	try {
		const url = await uploadFile(env, key, file);

		return { success: true, data: { key, url } };
	} catch {
		return { success: false, error: "Failed to upload image" };
	}
}
