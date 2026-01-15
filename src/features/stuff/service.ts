import { getDatabase, type Database } from "~/db";
import {
	ratings,
	stuff as stuffTable,
	ratingsToTags,
	tags,
	users,
} from "~/db/schema/";
import { and, isNull, desc, lt, eq, or, sql } from "drizzle-orm";
import { createServerOnlyFn } from "@tanstack/react-start";
import type { StuffRating } from "./types";

function transformToGroupedRating(row: {
	rating: typeof ratings.$inferSelect;
	stuff: typeof stuffTable.$inferSelect | null;
	user: {
		id: string;
		name: string | null;
		username: string | null;
		image: string | null;
	} | null;
	tags: string[];
}): StuffRating {
	return {
		...row.rating,
		stuff: row.stuff,
		user: row.user,
		tags: row.tags,
	};
}

function getRatingsSelection() {
	return {
		rating: ratings,
		stuff: stuffTable,
		user: {
			id: users.id,
			name: users.name,
			username: users.username,
			image: users.image,
		},
		tags: sql<string[]>`coalesce(
      json_agg(${tags.name}) filter (where ${tags.name} is not null), 
      '[]'
    )`,
	};
}

function parseCursor(cursor?: string) {
	if (!cursor) return undefined;
	const [datePart, id] = cursor.split("|");
	if (!datePart || !id) return undefined;
	const createdAt = new Date(datePart);
	if (Number.isNaN(createdAt.getTime())) return undefined;
	return { createdAt, id };
}

function makeCursor(createdAt: Date | string | number, id: string) {
	return `${new Date(createdAt).toISOString()}|${id}`;
}

async function extractImagesForStuff(
	db: Database,
	stuffId: string,
	maxImages = 8,
): Promise<string[]> {
	const imageRows = await db
		.select({ images: ratings.images })
		.from(ratings)
		.where(
			and(
				eq(ratings.stuffId, stuffId),
				sql`${ratings.images} IS NOT NULL`,
				isNull(ratings.deletedAt),
			),
		)
		.orderBy(desc(ratings.createdAt), desc(ratings.id))
		.limit(100);

	const images: string[] = [];
	const seen = new Set<string>();

	for (const r of imageRows) {
		if (!r.images) continue;
		try {
			const parsed: unknown = JSON.parse(r.images);
			if (Array.isArray(parsed)) {
				for (const img of parsed) {
					if (typeof img === "string" && !seen.has(img)) {
						images.push(img);
						seen.add(img);
						if (images.length >= maxImages) break;
					}
				}
			}
		} catch {}
		if (images.length >= maxImages) break;
	}

	return images;
}

export const getStuffBySlug = createServerOnlyFn(async (slug: string) => {
	const dbInstance = getDatabase();
	const rows = await dbInstance
		.select({
			id: stuffTable.id,
			name: stuffTable.name,
			slug: stuffTable.slug,
			createdAt: stuffTable.createdAt,
			updatedAt: stuffTable.updatedAt,
			ratingCount: sql<number>`COUNT(${ratings.id})`,
			avgScore: sql<number>`AVG(${ratings.score})`,
		})
		.from(stuffTable)
		.leftJoin(
			ratings,
			and(eq(ratings.stuffId, stuffTable.id), isNull(ratings.deletedAt)),
		)
		.where(eq(stuffTable.slug, slug))
		.groupBy(
			stuffTable.id,
			stuffTable.name,
			stuffTable.slug,
			stuffTable.createdAt,
			stuffTable.updatedAt,
		)
		.limit(1);

	if (rows.length === 0) return null;

	const row = rows[0];
	const ratingCount = Number(row.ratingCount ?? 0);
	const averageRating = ratingCount === 0 ? 0 : Number(row.avgScore ?? 0);
	const images = await extractImagesForStuff(dbInstance, row.id);

	return {
		id: row.id,
		name: row.name,
		slug: row.slug,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		averageRating,
		ratingCount,
		images,
	};
});

export const getStuffRatingsBySlug = createServerOnlyFn(
	async (slug: string, limit = 10, cursor?: string) => {
		const dbInstance = getDatabase();
		const parsed = parseCursor(cursor);
		const cursorFilter = parsed
			? or(
					lt(ratings.createdAt, parsed.createdAt),
					and(
						eq(ratings.createdAt, parsed.createdAt),
						lt(ratings.id, parsed.id),
					),
				)
			: undefined;

		const results = await dbInstance
			.select(getRatingsSelection())
			.from(ratings)
			.innerJoin(stuffTable, eq(ratings.stuffId, stuffTable.id))
			.leftJoin(users, eq(ratings.userId, users.id))
			.leftJoin(ratingsToTags, eq(ratings.id, ratingsToTags.ratingId))
			.leftJoin(tags, eq(ratingsToTags.tagId, tags.id))
			.where(
				and(eq(stuffTable.slug, slug), isNull(ratings.deletedAt), cursorFilter),
			)
			.groupBy(ratings.id, stuffTable.id, users.id)
			.orderBy(desc(ratings.createdAt), desc(ratings.id))
			.limit(limit);

		if (results.length === 0) {
			const stuffExists = await dbInstance
				.select({ id: stuffTable.id })
				.from(stuffTable)
				.where(eq(stuffTable.slug, slug))
				.limit(1)
				.execute()
				.then((rows) => rows.length > 0);

			if (!stuffExists) return null;

			return { ratings: [], nextCursor: undefined };
		}

		const mapped = results.map(transformToGroupedRating);

		let nextCursor: string | undefined;
		if (mapped.length === limit) {
			const last = mapped[mapped.length - 1];
			nextCursor = makeCursor(last.createdAt, last.id);
		}

		return { ratings: mapped, nextCursor };
	},
);
