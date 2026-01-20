import { stuff, ratings, tags, ratingsToTags } from "~/db/schema/";
import { eq, and, isNull, like, inArray, desc, sql } from "drizzle-orm";
import {
	createPresignedUploadUrl,
	uploadFile,
} from "~/features/file-storage/service";
import { generateSlug } from "~/utils/strings";
import { createServerOnlyFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import type { CreateRatingInput } from "./types";
import { getDatabase } from "~/db";
import { v7 as uuidv7 } from "uuid";

export const searchStuff = createServerOnlyFn(
	async (query: string, limit = 10) => {
		const q = query.toLowerCase().trim();

		if (!q) return [];

		const db = getDatabase();

		return db
			.select()
			.from(stuff)
			.where(
				and(like(sql`LOWER(${stuff.name})`, `${q}%`), isNull(stuff.deletedAt)),
			)
			.orderBy(desc(stuff.createdAt))
			.limit(limit);
	},
);

export const searchTags = createServerOnlyFn(
	async (query: string, limit = 10) => {
		const q = query.toLowerCase().trim();

		if (!q) return [];

		const db = getDatabase();

		return db
			.select()
			.from(tags)
			.where(like(sql`LOWER(${tags.name})`, `${q}%`))
			.orderBy(desc(tags.createdAt))
			.limit(limit);
	},
);

export const getOrCreateStuff = createServerOnlyFn(
	async (name: string, userId: string) => {
		const db = getDatabase();

		return db.transaction(async (tx) => {
			const existing = await tx
				.select()
				.from(stuff)
				.where(and(eq(stuff.name, name), isNull(stuff.deletedAt)))
				.limit(1)
				.then((res) => res[0]);

			if (existing) return null;

			try {
				const [newStuff] = await tx
					.insert(stuff)
					.values({ name, slug: generateSlug(name), createdBy: userId })
					.onConflictDoNothing()
					.returning();

				if (newStuff) return newStuff;

				const selected = await tx
					.select()
					.from(stuff)
					.where(and(eq(stuff.name, name), isNull(stuff.deletedAt)))
					.limit(1)
					.then((res) => res[0]);

				if (selected) return selected;

				return null;
			} catch {
				return null;
			}
		});
	},
);

export const createRating = createServerOnlyFn(
	async (userId: string, input: CreateRatingInput) => {
		const db = getDatabase();

		return db.transaction(async (tx) => {
			let resolvedStuffId = input.stuffId;

			if (!resolvedStuffId && input.stuffName) {
				const name = input.stuffName;

				const existing = await tx
					.select()
					.from(stuff)
					.where(and(eq(stuff.name, name), isNull(stuff.deletedAt)))
					.limit(1)
					.then((r) => r[0]);

				if (existing) {
					resolvedStuffId = existing.id;
				} else {
					const [inserted] = await tx
						.insert(stuff)
						.values({ name, slug: generateSlug(name), createdBy: userId })
						.onConflictDoNothing()
						.returning();

					if (inserted) {
						resolvedStuffId = inserted.id;
					} else {
						const selected = await tx
							.select()
							.from(stuff)
							.where(and(eq(stuff.name, name), isNull(stuff.deletedAt)))
							.limit(1)
							.then((r) => r[0]);

						if (selected) resolvedStuffId = selected.id;
					}
				}
			}

			if (!resolvedStuffId) {
				throw new Error(`Failed to determine the "stuff" for the rating`);
			}

			// Normalize and dedupe tag names
			const rawNames = input.tags ?? [];
			const normalizedNames = rawNames
				.map((n) => n?.toLowerCase().trim())
				.filter(Boolean) as string[];
			const uniqueNames = Array.from(new Set(normalizedNames));

			// Insert any missing tags (compare by lower-cased name)
			if (uniqueNames.length > 0) {
				const existingTags = await tx
					.select()
					.from(tags)
					.where(inArray(sql`LOWER(${tags.name})`, uniqueNames));

				const existingLower = new Set(
					existingTags.map((t) => t.name.toLowerCase()),
				);
				const toCreate = uniqueNames.filter((n) => !existingLower.has(n));

				if (toCreate.length > 0) {
					await tx
						.insert(tags)
						.values(toCreate.map((name) => ({ name, createdBy: userId })))
						.onConflictDoNothing()
						.execute();
				}
			}

			// Re-select tag objects for associations (if any)
			const tagObjects =
				uniqueNames.length > 0
					? await tx
							.select()
							.from(tags)
							.where(inArray(sql`LOWER(${tags.name})`, uniqueNames))
					: [];

			// create a slug based on the stuff name (or provided stuffName) plus a short random suffix
			const imagesJson = JSON.stringify(input.images ?? []);

			const [rating] = await tx
				.insert(ratings)
				.values({
					userId,
					stuffId: resolvedStuffId,
					score: input.score,
					content: input.content,
					images: imagesJson,
					upvotesCount: 1,
				})
				.returning();

			if (!rating) throw new Error("Failed to create rating");

			if (tagObjects.length > 0) {
				await tx
					.insert(ratingsToTags)
					.values(
						tagObjects.map((tag) => ({ ratingId: rating.id, tagId: tag.id })),
					)
					.onConflictDoNothing()
					.execute();
			}

			return rating;
		});
	},
);

export const getUploadUrl = createServerOnlyFn(
	async (ratingId: string, filename: string, contentType: string) => {
		const origExt = filename?.split(".").pop() ?? "webp";
		const extension =
			contentType === "image/webp" || origExt.toLowerCase() === "webp"
				? "webp"
				: origExt;
		const key = `ratings/${ratingId}/${uuidv7()}.${extension}`;

		const presign = await createPresignedUploadUrl(key);
		return presign;
	},
);

export const updateRatingImages = createServerOnlyFn(
	async (ratingId: string, images: string[]) => {
		const db = getDatabase();

		const updated = await db
			.update(ratings)
			.set({ images: JSON.stringify(images), updatedAt: new Date() })
			.where(eq(ratings.id, ratingId))
			.returning();

		if (!updated || updated.length === 0) return null;

		const row = updated[0];
		return {
			...row,
			images:
				typeof row.images === "string" ? JSON.parse(row.images) : row.images,
		};
	},
);

export const uploadRatingImage = createServerOnlyFn(
	async (ratingId: string, buffer: Uint8Array, contentType: string) => {
		const extension = contentType.split("/")[1] ?? "webp";
		const key = `ratings/${ratingId}/${uuidv7()}.${extension}`;

		// Pass buffer directly as uploadFile handles ArrayBuffer/Uint8Array
		const url = await uploadFile(env.R2_BUCKET, key, buffer, {
			type: contentType,
		});

		return { key, url };
	},
);
