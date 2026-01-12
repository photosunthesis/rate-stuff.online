import { env } from "cloudflare:workers";
import { getDb } from "~/db/index";
import { stuff, ratings, tags, ratingsToTags } from "~/db/schema";
import { eq, and, isNull, like, inArray, desc, sql } from "drizzle-orm";
import type { CreateRatingInput } from "./types";
import type { Stuff, Tag } from "~/features/display-ratings/types";
import { uploadFile } from "~/utils/media-storage-utils";
import { generateSlug } from "~/utils/slug-utils";
import { safeRandomUUID } from "~/utils/uuid-utils";

type Result<T> =
	| { success: true; data: T }
	| { success: false; error: string; fieldErrors?: Record<string, string> };

export async function searchStuff(query: string, limit = 10) {
	const db = getDb(env);
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
}

export async function searchTags(query: string, limit = 10) {
	const db = getDb(env);
	const q = query.toLowerCase().trim();

	if (!q) return [];

	return db
		.select()
		.from(tags)
		.where(like(sql`LOWER(${tags.name})`, `${q}%`))
		.orderBy(desc(tags.createdAt))
		.limit(limit);
}

async function getOrCreateStuff(name: string): Promise<Stuff | null> {
	const db = getDb(env);

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
				.values({ name, slug: generateSlug(name) })
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
}

async function createTags(names: string[]): Promise<Tag[]> {
	const db = getDb(env);

	return db.transaction(async (tx) => {
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
				.values(newNames.map((name) => ({ name })))
				.onConflictDoNothing()
				.execute();
		}

		return tx.select().from(tags).where(inArray(tags.name, uniqueNames));
	});
}

export async function createRating(
	userId: string,
	input: CreateRatingInput,
): Promise<Result<typeof ratings.$inferSelect>> {
	const db = getDb(env);

	return db.transaction(async (tx) => {
		let stuffId = input.stuffId;

		if (!stuffId && input.stuffName) {
			const stuffResult = await getOrCreateStuff(input.stuffName);

			if (!stuffResult) {
				return {
					success: false,
					error: "Failed to create or find stuff",
					fieldErrors: { stuffId: "Failed to create or find stuff" },
				};
			}
			stuffId = stuffResult.id;
		}

		if (!stuffId) {
			return {
				success: false,
				error: "Stuff ID is required",
				fieldErrors: { stuffId: "Please select or create something to rate" },
			};
		}

		const tagObjects = await createTags(input.tags);

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

		return { success: true, data: rating };
	});
}

export async function uploadImage(
	file: File,
	ratingId: string,
): Promise<Result<{ key: string; url: string }>> {
	const origExt = file.name?.split(".").pop() ?? "webp";
	const extension =
		file.type === "image/webp" || origExt.toLowerCase() === "webp"
			? "webp"
			: origExt;
	const key = `ratings/${ratingId}/${safeRandomUUID()}.${extension}`;

	try {
		const url = await uploadFile(env, key, file);

		return { success: true, data: { key, url } };
	} catch {
		return { success: false, error: "Failed to upload image" };
	}
}

export async function updateRatingImages(
	ratingId: string,
	images: string[],
): Promise<Result<null>> {
	try {
		const db = getDb(env);

		await db
			.update(ratings)
			.set({ images: JSON.stringify(images), updatedAt: new Date() })
			.where(eq(ratings.id, ratingId));

		return { success: true, data: null };
	} catch {
		return { success: false, error: "Failed to update rating images" };
	}
}
