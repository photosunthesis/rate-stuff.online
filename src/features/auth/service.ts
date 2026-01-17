import { users, ratings, inviteCodes } from "~/db/schema/";
import { eq, and, isNull, sql } from "drizzle-orm";
import { uploadFile } from "~/features/file-storage/service";
import { numberWithCommas } from "~/utils/numbers";
import { createServerOnlyFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { getDatabase } from "~/db";
import { v7 as uuidv7 } from "uuid";

export const updateUserProfile = createServerOnlyFn(
	async (userId: string, updates: { name?: string; image?: string | null }) => {
		const db = getDatabase();
		const updatedUser = await db
			.update(users)
			.set({ ...updates, updatedAt: new Date() })
			.where(eq(users.id, userId))

			.returning({
				id: users.id,
				username: users.username,
				name: users.name,
				image: users.image,
			});

		if (!updatedUser || updatedUser.length === 0) {
			throw new Error("User not found");
		}

		return updatedUser[0];
	},
);

export const getUserByUsername = createServerOnlyFn(
	async (username: string) => {
		const db = getDatabase();
		const ratingCountSq = db
			.select({ count: sql`count(*)` })
			.from(ratings)
			.where(and(eq(ratings.userId, users.id), isNull(ratings.deletedAt)));

		const rows = await db
			.select({
				id: users.id,
				username: users.username,
				name: users.name,
				image: users.image,
				createdAt: users.createdAt,
				ratingCount: sql<number>`(${ratingCountSq})`,
			})
			.from(users)
			.where(eq(users.username, username))
			.limit(1);

		if (!rows || rows.length === 0) return null;

		const row = rows[0];

		return {
			id: row.id,
			username: row.username,
			name: row.name,
			image: row.image,
			createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,

			ratingsCount: numberWithCommas(Number(row.ratingCount ?? 0)),
		};
	},
);

export const uploadProfileImage = createServerOnlyFn(
	async (file: File, userId: string) => {
		const origExt = file.name?.split(".").pop() ?? "webp";
		const extension =
			file.type === "image/webp" || origExt.toLowerCase() === "webp"
				? "webp"
				: origExt;
		const key = `avatars/${userId}/${uuidv7()}.${extension}`;
		const url = await uploadFile(env.R2_BUCKET, key, file);

		return { key, url };
	},
);

export const validateInviteCode = createServerOnlyFn(
	async (inviteCode: string) => {
		const db = getDatabase();
		const code = await db
			.select({ id: inviteCodes.id })
			.from(inviteCodes)
			.where(
				and(
					eq(inviteCodes.code, inviteCode),
					isNull(inviteCodes.usedBy),
					isNull(inviteCodes.usedAt),
				),
			)
			.limit(1);

		return code.length > 0;
	},
);

export const markInviteCodeAsUsed = createServerOnlyFn(
	async (inviteCode: string, userId: string) => {
		const db = getDatabase();
		await db
			.update(inviteCodes)
			.set({
				usedBy: userId,
				usedAt: new Date(),
			})
			.where(eq(inviteCodes.code, inviteCode));
	},
);
