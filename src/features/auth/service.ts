import { db } from "~/lib/db";
import { users, ratings, inviteCodes } from "~/db/schema/";
import { eq, and, isNull, sql } from "drizzle-orm";
import { uploadFile } from "~/features/file-storage/service";
import { numberWithCommas } from "~/lib/utils/numbers";
import { createServerOnlyFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

export const updateUserProfile = createServerOnlyFn(
	async (userId: string, updates: { name?: string; image?: string | null }) => {
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
			name: updatedUser[0].name,
			image: updatedUser[0].image,
		};
	},
);

export const getUserByUsername = createServerOnlyFn(
	async (username: string) => {
		const rows = await db
			.select({
				id: users.id,
				username: users.username,
				name: users.name,
				image: users.image,
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
				users.image,
				users.createdAt,
			)
			.limit(1);

		if (!rows || rows.length === 0) return null;

		const row = rows[0];
		const ratingsCount = Number(row.ratingCount ?? 0);

		return {
			id: row.id,
			username: row.username,
			name: row.name,
			image: row.image,
			createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
			ratingsCount: numberWithCommas(ratingsCount),
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
		const key = `avatars/${userId}/${crypto.randomUUID()}.${extension}`;
		const url = await uploadFile(env.R2_BUCKET, key, file);

		return { key, url };
	},
);

export const validateInviteCode = createServerOnlyFn(
	async (inviteCode: string) => {
		const code = await db
			.select()
			.from(inviteCodes)
			.where(
				and(
					eq(inviteCodes.code, inviteCode),
					isNull(inviteCodes.usedBy),
					isNull(inviteCodes.usedAt),
				),
			)
			.limit(1)
			.then((res) => res[0]);

		return !!code;
	},
);

export const markInviteCodeAsUsed = createServerOnlyFn(
	async (inviteCode: string, userId: string) => {
		await db
			.update(inviteCodes)
			.set({
				usedBy: userId,
				usedAt: new Date(),
			})
			.where(eq(inviteCodes.code, inviteCode));
	},
);
