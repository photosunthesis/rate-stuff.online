import {
	stuff,
	ratings,
	tags,
	ratingsToTags,
} from "~/infrastructure/db/schema/";
import { eq, and, isNull, like, inArray, desc, sql } from "drizzle-orm";
import { createPresignedUploadUrl } from "~/infrastructure/file-storage/service";
import { generateSlug } from "~/shared/lib/strings";
import { createServerOnlyFn } from "@tanstack/react-start";
import type { CreateRatingInput } from "../types/create";
import { getDatabase } from "~/infrastructure/db";
import { v7 as uuidv7 } from "uuid";
import { invalidate } from "~/infrastructure/kv/cache";
import { generateContentPreview } from "~/shared/lib/rich-text";

interface UpdateRatingInput {
	score: number;
	content: string;
	tags: string[];
	images: string[];
}

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

		const rating = await db.transaction(async (tx) => {
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

			const rawNames = input.tags ?? [];
			const normalizedNames = rawNames
				.map((n) => n?.toLowerCase().trim())
				.filter(Boolean) as string[];
			const uniqueNames = Array.from(new Set(normalizedNames));

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

			const tagObjects =
				uniqueNames.length > 0
					? await tx
							.select()
							.from(tags)
							.where(inArray(sql`LOWER(${tags.name})`, uniqueNames))
					: [];

			const imagesJson = JSON.stringify(input.images ?? []);

			const [rating] = await tx
				.insert(ratings)
				.values({
					userId,
					stuffId: resolvedStuffId,
					score: input.score,
					content: input.content,
					contentPreview: generateContentPreview(input.content),
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

		const stuffRow = await db
			.select({ slug: stuff.slug })
			.from(stuff)
			.where(eq(stuff.id, rating.stuffId))
			.limit(1)
			.then((r) => r[0]);

		if (stuffRow) {
			invalidate(
				`stuff:${stuffRow.slug}`,
				"discover:tags",
				"discover:stuff",
				"feed:public:first",
				"sitemap",
			);
		}

		return rating;
	},
);

export const getUploadUrl = createServerOnlyFn(
	async (
		userId: string,
		ratingId: string,
		filename: string,
		contentType: string,
	) => {
		const db = getDatabase();
		const existing = await db
			.select({ userId: ratings.userId })
			.from(ratings)
			.where(and(eq(ratings.id, ratingId), isNull(ratings.deletedAt)))
			.limit(1)
			.then((rows) => rows[0]);

		if (existing && existing.userId !== userId) {
			throw new Error(
				"You don't have permission to upload images to this rating",
			);
		}

		const origExt = filename?.split(".").pop() ?? "webp";
		const extension =
			contentType === "image/webp" || origExt.toLowerCase() === "webp"
				? "webp"
				: origExt;
		const key = `ratings/${ratingId}/${uuidv7()}.${extension}`;

		const presign = await createPresignedUploadUrl(key, userId, contentType);
		return presign;
	},
);

export const updateRatingImages = createServerOnlyFn(
	async (userId: string, ratingId: string, images: string[]) => {
		const db = getDatabase();

		const updated = await db
			.update(ratings)
			.set({ images: JSON.stringify(images), updatedAt: new Date() })
			.where(
				and(
					eq(ratings.id, ratingId),
					eq(ratings.userId, userId),
					isNull(ratings.deletedAt),
				),
			)
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

export const updateRating = createServerOnlyFn(
	async (userId: string, ratingId: string, input: UpdateRatingInput) => {
		const db = getDatabase();

		const updated = await db.transaction(async (tx) => {
			const existingRating = await tx
				.select()
				.from(ratings)
				.where(
					and(
						eq(ratings.id, ratingId),
						eq(ratings.userId, userId),
						isNull(ratings.deletedAt),
					),
				)
				.limit(1)
				.then((rows) => rows[0]);

			if (!existingRating) {
				throw new Error(
					"Rating not found or you don't have permission to edit it",
				);
			}

			const rawNames = input.tags ?? [];
			const normalizedNames = rawNames
				.map((n) => n?.toLowerCase().trim())
				.filter(Boolean) as string[];
			const uniqueNames = Array.from(new Set(normalizedNames));

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

			const tagObjects =
				uniqueNames.length > 0
					? await tx
							.select()
							.from(tags)
							.where(inArray(sql`LOWER(${tags.name})`, uniqueNames))
					: [];

			await tx
				.delete(ratingsToTags)
				.where(eq(ratingsToTags.ratingId, ratingId));

			if (tagObjects.length > 0) {
				await tx
					.insert(ratingsToTags)
					.values(
						tagObjects.map((tag) => ({ ratingId: ratingId, tagId: tag.id })),
					)
					.onConflictDoNothing()
					.execute();
			}

			const imagesJson = JSON.stringify(input.images ?? []);

			const [updatedRating] = await tx
				.update(ratings)
				.set({
					score: input.score,
					content: input.content,
					contentPreview: generateContentPreview(input.content),
					images: imagesJson,
					updatedAt: new Date(),
				})
				.where(eq(ratings.id, ratingId))
				.returning();

			return updatedRating;
		});

		const stuffRow = await db
			.select({ slug: stuff.slug })
			.from(stuff)
			.innerJoin(ratings, eq(ratings.stuffId, stuff.id))
			.where(eq(ratings.id, ratingId))
			.limit(1)
			.then((r) => r[0]);

		if (stuffRow) {
			invalidate(`stuff:${stuffRow.slug}`, "feed:public:first");
		}

		return updated;
	},
);

export const deleteRating = createServerOnlyFn(
	async (ratingId: string, userId: string) => {
		const db = getDatabase();

		const existing = await db
			.select({ stuffId: ratings.stuffId })
			.from(ratings)
			.where(
				and(
					eq(ratings.id, ratingId),
					eq(ratings.userId, userId),
					isNull(ratings.deletedAt),
				),
			)
			.limit(1)
			.then((rows) => rows[0]);

		if (!existing) {
			throw new Error(
				"Rating not found or you don't have permission to delete it",
			);
		}

		await db.delete(ratings).where(eq(ratings.id, ratingId));

		const stuffRow = await db
			.select({ slug: stuff.slug })
			.from(stuff)
			.where(eq(stuff.id, existing.stuffId))
			.limit(1)
			.then((r) => r[0]);

		if (stuffRow) {
			invalidate(
				`stuff:${stuffRow.slug}`,
				"discover:tags",
				"discover:stuff",
				"feed:public:first",
				"sitemap",
			);
		}

		return { success: true };
	},
);
