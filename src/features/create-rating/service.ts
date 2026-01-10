import { env } from "cloudflare:workers";
import { db } from "~/db/index";
import { stuff, ratings, tags, ratingsToTags } from "~/db/schema";
import { eq, and, isNull, like, inArray, desc, sql } from "drizzle-orm";
import type { CreateRatingInput } from "./types";
import type { Stuff, Tag } from "~/features/display-ratings/types";
import { uploadFile } from "~/utils/media-storage-utils";
import crypto from "node:crypto";

type Result<T> =
	| { success: true; data: T }
	| { success: false; error: string; fieldErrors?: Record<string, string> };

export async function searchStuff(query: string, limit = 10) {
	const q = query.toLowerCase().trim();
	if (!q) return [];

	return db.query.stuff.findMany({
		where: and(
			like(sql`LOWER(${stuff.name})`, `${q}%`),
			isNull(stuff.deletedAt),
		),
		limit,
		orderBy: desc(stuff.createdAt),
	});
}

export async function searchTags(query: string, limit = 10) {
	const q = query.toLowerCase().trim();
	if (!q) return [];

	return db.query.tags.findMany({
		where: like(sql`LOWER(${tags.name})`, `${q}%`),
		limit,
	});
}

export async function getOrCreateStuff(name: string): Promise<Result<Stuff>> {
	const existing = await db.query.stuff.findFirst({
		where: and(eq(stuff.name, name), isNull(stuff.deletedAt)),
	});

	if (existing) {
		return { success: true, data: existing };
	}

	try {
		const [newStuff] = await db.insert(stuff).values({ name }).returning();
		return { success: true, data: newStuff };
	} catch {
		return { success: false, error: "Failed to create stuff" };
	}
}

export async function createTags(names: string[]): Promise<Tag[]> {
	if (names.length === 0) return [];

	const normalizedNames = names.map((n) => n.toLowerCase().trim());
	const uniqueNames = Array.from(new Set(normalizedNames));

	const existingTags = await db.query.tags.findMany({
		where: inArray(tags.name, uniqueNames),
	});
	const existingNames = new Set(existingTags.map((t) => t.name));
	const newNames = uniqueNames.filter((n) => !existingNames.has(n));

	if (newNames.length > 0) {
		// Bulk-insert missing tag names and ignore conflicts if they already exist.
		// If the driver doesn't support `onConflictDoNothing`, this will throw
		// and surface the error so it can be handled by the caller.
		await db
			.insert(tags)
			.values(newNames.map((name) => ({ name })))
			.onConflictDoNothing()
			.run();
	}

	return db.query.tags.findMany({ where: inArray(tags.name, uniqueNames) });
}

export async function createRating(
	userId: string,
	input: CreateRatingInput,
): Promise<Result<typeof ratings.$inferSelect>> {
	let stuffId = input.stuffId;

	if (!stuffId && input.stuffName) {
		const stuffResult = await getOrCreateStuff(input.stuffName);
		if (!stuffResult.success) {
			return {
				success: false,
				error: stuffResult.error,
				fieldErrors: { stuffId: stuffResult.error },
			};
		}
		stuffId = stuffResult.data.id;
	}

	if (!stuffId) {
		return {
			success: false,
			error: "Stuff ID is required",
			fieldErrors: { stuffId: "Please select or create something to rate" },
		};
	}

	try {
		const tagObjects = await createTags(input.tags);

		function slugify(s: string) {
			return s
				.toLowerCase()
				.trim()
				.replace(/[^a-z0-9\s-]/g, "")
				.replace(/\s+/g, "-")
				.replace(/-+/g, "-")
				.replace(/^-|-$/g, "");
		}

		const MAX_SLUG_LENGTH = 128;
		const SUFFIX = `-${crypto.randomBytes(3).toString("hex")}`; // 7 chars including '-'
		const rawBase = slugify(input.title || "rating");
		const baseMax = Math.max(1, MAX_SLUG_LENGTH - SUFFIX.length);
		const base = rawBase.slice(0, baseMax);
		const slug = `${base}${SUFFIX}`;

		const [rating] = await db
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
			await db.insert(ratingsToTags).values(
				tagObjects.map((tag) => ({
					ratingId: rating.id,
					tagId: tag.id,
				})),
			);
		}

		return { success: true, data: rating };
	} catch {
		return { success: false, error: "Failed to create rating" };
	}
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
	const key = `ratings/${ratingId}/${crypto.randomUUID()}.${extension}`;

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
		await db
			.update(ratings)
			.set({ images: JSON.stringify(images), updatedAt: new Date() })
			.where(eq(ratings.id, ratingId));

		return { success: true, data: null };
	} catch {
		return { success: false, error: "Failed to update rating images" };
	}
}
