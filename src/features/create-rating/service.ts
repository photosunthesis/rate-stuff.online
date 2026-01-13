import { db } from "~/db/db";
import { stuff, ratings, tags, ratingsToTags } from "~/db/schema/";
import { eq, and, isNull, like, inArray, desc, sql } from "drizzle-orm";
import type { CreateRatingInput } from "./types";
import { uploadFile } from "~/lib/core/media-storage";
import { generateSlug } from "~/lib/utils/strings";
import { createServerOnlyFn } from "@tanstack/react-start";

export const searchStuff = createServerOnlyFn(
	async (query: string, limit = 10) => {
		const q = query.toLowerCase().trim();

		if (!q) return [];

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

		return db
			.select()
			.from(tags)
			.where(like(sql`LOWER(${tags.name})`, `${q}%`))
			.orderBy(desc(tags.createdAt))
			.limit(limit);
	},
);

export const getOrCreateStuff = createServerOnlyFn(
	async (name: string, userId: string) =>
		db.transaction(async (tx) => {
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
		}),
);

export const createTags = createServerOnlyFn(
	async (names: string[], userId: string) =>
		db.transaction(async (tx) => {
			if (names.length === 0) return [];

			const normalizedNames = names.map((n) => n.toLowerCase().trim());
			const uniqueNames = Array.from(new Set(normalizedNames));
			const existingTags = await tx
				.select()
				.from(tags)
				.where(inArray(tags.name, uniqueNames));
			const existingNames = new Set(existingTags.map((t) => t.name));
			const newNames = uniqueNames.filter((n) => !existingNames.has(n));

			if (newNames.length > 0) {
				await tx
					.insert(tags)
					.values(newNames.map((name) => ({ name, createdBy: userId })))
					.onConflictDoNothing()
					.execute();
			}

			return tx.select().from(tags).where(inArray(tags.name, uniqueNames));
		}),
);

export const createRating = createServerOnlyFn(
	async (userId: string, input: CreateRatingInput) =>
		db.transaction(async (tx) => {
			let stuffId = input.stuffId;

			if (!stuffId && input.stuffName) {
				const stuffResult = await getOrCreateStuff(input.stuffName, userId);

				if (!stuffResult) {
					throw new Error(`Failed to create or retrieve "stuff"`);
				}

				stuffId = stuffResult.id;
			}

			if (!stuffId) {
				throw new Error(`Failed to determine the "stuff" for the rating`);
			}

			const tagObjects = await createTags(input.tags, userId);
			const slug = generateSlug(input.title);
			const [rating] = await tx
				.insert(ratings)
				.values({
					userId,
					stuffId: stuffId,
					title: input.title,
					score: input.score,
					content: input.content,
					images: JSON.stringify(input.images),
					slug,
				})
				.returning();

			if (tagObjects.length > 0) {
				await tx
					.insert(ratingsToTags)
					.values(
						tagObjects.map((tag) => ({ ratingId: rating.id, tagId: tag.id })),
					);
			}

			return rating;
		}),
);

export const uploadImage = createServerOnlyFn(
	async (file: File, ratingId: string) => {
		const origExt = file.name?.split(".").pop() ?? "webp";
		const extension =
			file.type === "image/webp" || origExt.toLowerCase() === "webp"
				? "webp"
				: origExt;
		const key = `ratings/${ratingId}/${crypto.randomUUID()}.${extension}`;
		const url = await uploadFile(key, file);

		return { key, url };
	},
);

export const updateRatingImages = createServerOnlyFn(
	async (ratingId: string, images: string[]) => {
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
