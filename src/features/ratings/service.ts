import { env } from "cloudflare:workers";
import { db } from "~/db/index";
import { stuff, ratings, tags, ratingsToTags } from "~/db/schema";
import { eq, and, isNull, like, inArray, desc, lt } from "drizzle-orm";
import type { CreateRatingInput, Stuff, Tag } from "./types";
import { uploadFile } from "~/utils/media-storage";

type Result<T> =
	| { success: true; data: T }
	| { success: false; error: string; fieldErrors?: Record<string, string> };

export async function searchStuff(query: string, limit = 10) {
	return db.query.stuff.findMany({
		where: and(like(stuff.name, `%${query}%`), isNull(stuff.deletedAt)),
		limit,
		orderBy: desc(stuff.createdAt),
	});
}

export async function searchTags(query: string, limit = 10) {
	return db.query.tags.findMany({
		where: like(tags.name, `%${query}%`),
		limit,
	});
}

export async function getUserRatings(
	userId: string,
	limit = 10,
	cursor?: string,
) {
	return db.query.ratings.findMany({
		where: and(
			eq(ratings.userId, userId),
			isNull(ratings.deletedAt),
			cursor ? lt(ratings.createdAt, cursor) : undefined,
		),
		limit,
		orderBy: desc(ratings.createdAt),
		with: {
			stuff: true,
			user: {
				columns: {
					id: true,
					name: true,
					username: true,
					avatarKey: true,
				},
			},
			tags: {
				with: {
					tag: true,
				},
			},
		},
	});
}

export async function getFeedRatings(limit = 10, cursor?: string) {
	const results = await db.query.ratings.findMany({
		where: and(
			isNull(ratings.deletedAt),
			cursor ? lt(ratings.createdAt, cursor) : undefined,
		),
		limit,
		orderBy: desc(ratings.createdAt),
		with: {
			stuff: true,
			user: {
				columns: {
					id: true,
					name: true,
					username: true,
					avatarKey: true,
				},
			},
			tags: {
				with: {
					tag: true,
				},
			},
		},
	});

	return results;
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

	let newTags: (typeof tags.$inferSelect)[] = [];
	if (newNames.length > 0) {
		newTags = await db
			.insert(tags)
			.values(newNames.map((name) => ({ name })))
			.returning();
	}

	return [...existingTags, ...newTags];
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

		const [rating] = await db
			.insert(ratings)
			.values({
				userId,
				stuffId: stuffId,
				title: input.title,
				score: input.score,
				content: input.content,
				images: JSON.stringify(input.images),
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
	userId: string,
): Promise<Result<{ key: string; url: string }>> {
	const key = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;

	try {
		await uploadFile(env, key, file);
		const url = `/api/images/${key}`;

		return { success: true, data: { key, url } };
	} catch {
		return { success: false, error: "Failed to upload image" };
	}
}
