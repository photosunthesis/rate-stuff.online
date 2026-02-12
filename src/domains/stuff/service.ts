import { getDatabase, type Database } from "~/db";
import {
	ratings,
	stuff as stuffTable,
	ratingsToTags,
	tags,
	users,
	ratingVotes,
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
	userVote: "up" | "down" | null;
}): StuffRating {
	return {
		...row.rating,
		stuff: row.stuff,
		user: row.user,
		tags: row.tags,
		userVote: row.userVote,
	};
}

function getRatingsSelection(viewerId?: string) {
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
		userVote: viewerId
			? sql<
					"up" | "down" | null
				>`(select ${ratingVotes.type} from ${ratingVotes} where ${ratingVotes.ratingId} = ${ratings.id} and ${ratingVotes.userId} = ${viewerId})`
			: sql<null>`null`,
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
	// We use raw SQL here because Drizzle's query builder doesn't yet support `CROSS JOIN LATERAL`
	// with `json_array_elements_text`, which is required to efficiently unpack the JSON array
	// inside the database. This avoids fetching 100 heavily-loaded rows to the worker.
	//
	// SAFETY: This is safe from SQL injection because we use Drizzle's `sql` template tag,
	// which automatically parameterizes all inputs (like ${stuffId}).
	const result = await db.execute(sql`
    WITH recent_images AS (
      SELECT t.image
      FROM ${ratings} r
      CROSS JOIN LATERAL json_array_elements_text(
        CASE 
          WHEN r.images IS NULL OR r.images = '' THEN '[]'::json 
          ELSE r.images::json 
        END
      ) as t(image)
      WHERE r.stuff_id = ${stuffId}
        AND r.images IS NOT NULL
        AND r.deleted_at IS NULL
      ORDER BY r.created_at DESC, r.id DESC
      LIMIT 100
    )
    SELECT DISTINCT image FROM recent_images LIMIT ${maxImages}
  `);

	return result.map((row) => row.image as string);
}

export const getStuffBySlug = createServerOnlyFn(async (slug: string) => {
	const db = getDatabase();
	const rows = await db
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
	const images = await extractImagesForStuff(db, row.id);

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
	async (slug: string, limit = 10, cursor?: string, viewerId?: string) => {
		const db = getDatabase();
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

		const results = await db
			.select(getRatingsSelection(viewerId))
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
			const stuffExists = await db
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
