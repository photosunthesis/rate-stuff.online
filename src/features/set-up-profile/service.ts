import { db } from "~/db/index";
import { users, ratings } from "~/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { uploadFile } from "~/lib/media-storage";
import { numberWithCommas } from "~/utils/numbers";
import { createServerOnlyFn } from "@tanstack/react-start";

export const updateUserProfile = createServerOnlyFn(
	async (
		userId: string,
		updates: { name?: string; avatarUrl?: string | null },
	) => {
		const updatedUser = await db()
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
	},
);

export const getUserById = createServerOnlyFn(async (userId: string) => {
	const user = await db()
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
});

export const getUserByUsername = createServerOnlyFn(
	async (username: string) => {
		const rows = await db()
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
		const url = await uploadFile(key, file);

		return { key, url };
	},
);
