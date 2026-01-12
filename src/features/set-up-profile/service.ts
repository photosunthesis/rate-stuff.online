import { getDb } from "~/db/index";
import { env } from "cloudflare:workers";
import { users, ratings } from "~/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import type { PublicUser } from "~/features/set-up-profile/types";
import { uploadFile } from "~/utils/media-storage-utils";
import { numberWithCommas } from "~/utils/number-utils";
import { safeRandomUUID } from "~/utils/uuid-utils";

export async function updateUserProfile(
	userId: string,
	updates: { name?: string; avatarUrl?: string | null },
): Promise<PublicUser> {
	const db = getDb(env);
	const updatedUser = await db
		.update(users)
		.set({ ...updates, updatedAt: new Date() })
		.where(eq(users.id, userId))
		.returning();

	if (!updatedUser || updatedUser.length === 0) {
		throw new Error("User not found");
	}

	return {
		id: updatedUser[0].id,
		username: updatedUser[0].username,
		displayName: updatedUser[0].name,
		avatarUrl: updatedUser[0].avatarUrl,
	};
}

export async function getUserById(userId: string): Promise<PublicUser | null> {
	const db = getDb(env);
	const user = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		.limit(1)
		.then((res) => res[0]);

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
	const db = getDb(env);
	const rows = await db
		.select({
			id: users.id,
			username: users.username,
			name: users.name,
			avatarUrl: users.avatarUrl,
			createdAt: users.createdAt,
			ratingCount: sql`COUNT(${ratings.id})`,
		})
		.from(users)
		.leftJoin(
			ratings,
			and(eq(ratings.userId, users.id), isNull(ratings.deletedAt)),
		)
		.where(eq(users.username, username))
		.groupBy(
			users.id,
			users.username,
			users.name,
			users.avatarUrl,
			users.createdAt,
		)
		.limit(1);

	if (!rows || rows.length === 0) return null;

	const row = rows[0];
	const ratingsCount = Number(row.ratingCount ?? 0);

	return {
		id: row.id,
		username: row.username,
		displayName: row.name,
		avatarUrl: row.avatarUrl,
		createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
		ratingsCount: numberWithCommas(ratingsCount),
	};
}

export async function uploadProfileImage(
	file: File,
	userId: string,
): Promise<{ key: string; url: string }> {
	const origExt = file.name?.split(".").pop() ?? "webp";
	const extension =
		file.type === "image/webp" || origExt.toLowerCase() === "webp"
			? "webp"
			: origExt;
	const key = `avatars/${userId}/${safeRandomUUID()}.${extension}`;
	const url = await uploadFile(env, key, file);

	return { key, url };
}
