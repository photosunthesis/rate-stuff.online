import { db } from "~/db/index";
import { ratings, stuff as stuffTable } from "~/db/schema";
import { and, isNull, desc, lt, eq, or, sql } from "drizzle-orm";
import type { RatingWithRelations } from "~/features/display-ratings/types";
import type { StuffWithAggregates, StuffRatingsPage } from "./types";

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

export async function getStuffBySlug(
	slug: string,
): Promise<StuffWithAggregates | null> {
	const rows = await db
		.select({
			id: stuffTable.id,
			name: stuffTable.name,
			slug: stuffTable.slug,
			createdAt: stuffTable.createdAt,
			updatedAt: stuffTable.updatedAt,
			ratingCount: sql`COUNT(${ratings.id})`,
			avgScore: sql`AVG(${ratings.score})`,
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

	const imageRows = await db
		.select({ images: ratings.images })
		.from(ratings)
		.where(
			and(
				eq(ratings.stuffId, row.id),
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
						if (images.length >= 8) break;
					}
				}
			}
		} catch {}
		if (images.length >= 8) break;
	}

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
}

export async function getStuffRatingsBySlug(
	slug: string,
	limit = 10,
	cursor?: string,
): Promise<StuffRatingsPage | null> {
	const parsed = parseCursor(cursor);
	const cursorFilter = parsed
		? or(
				lt(ratings.createdAt, parsed.createdAt),
				and(eq(ratings.createdAt, parsed.createdAt), lt(ratings.id, parsed.id)),
			)
		: undefined;

	// Find stuff id first (more reliable than embedding a subquery in sqlite)
	const s = await db.query.stuff.findFirst({
		where: eq(stuffTable.slug, slug),
		columns: { id: true },
	});
	if (!s) return null;

	const results = await db.query.ratings.findMany({
		where: and(
			eq(ratings.stuffId, s.id),
			isNull(ratings.deletedAt),
			cursorFilter,
		),
		limit,
		orderBy: [desc(ratings.createdAt), desc(ratings.id)],
		with: {
			stuff: true,
			user: {
				columns: {
					id: true,
					name: true,
					username: true,
					avatarUrl: true,
				},
			},
			tags: {
				with: {
					tag: true,
				},
			},
		},
	});

	if (results.length === 0) {
		return { ratings: [], nextCursor: undefined };
	}

	const mapped: RatingWithRelations[] = results.map((r) => ({
		...r,
		tags: (r.tags ?? []).map((t) => t.tag.name),
	}));

	let nextCursor: string | undefined;
	if (mapped.length === limit) {
		const last = mapped[mapped.length - 1];
		nextCursor = makeCursor(last.createdAt, last.id);
	}

	return { ratings: mapped, nextCursor };
}
