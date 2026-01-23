import { getDatabase } from "~/db";
import { ratings, users, stuff } from "~/db/schema";
import { createServerOnlyFn } from "@tanstack/react-start";
import { desc, isNotNull, and, sql, or, lt, eq } from "drizzle-orm";

export const getVisualRatings = createServerOnlyFn(
	async (
		limit = 20,
		cursor?: {
			createdAt: Date;
			id: string;
		},
	) => {
		const db = getDatabase();

		const cursorFilter = cursor
			? or(
					lt(ratings.createdAt, cursor.createdAt),
					and(
						eq(ratings.createdAt, cursor.createdAt),
						lt(ratings.id, cursor.id),
					),
				)
			: undefined;

		const rows = await db
			.select({
				rating: ratings,
				user: {
					id: users.id,
					name: users.name,
					username: users.username,
					image: users.image,
				},
				stuff: stuff,
			})
			.from(ratings)
			.innerJoin(users, sql`${ratings.userId} = ${users.id}`)
			.innerJoin(stuff, sql`${ratings.stuffId} = ${stuff.id}`)
			.where(
				and(
					isNotNull(ratings.images),
					sql`${ratings.images} != '[]'`,
					cursorFilter,
				),
			)
			.orderBy(desc(ratings.createdAt), desc(ratings.id))
			.limit(limit + 1);

		const hasNextPage = rows.length > limit;
		const items = hasNextPage ? rows.slice(0, limit) : rows;

		const nextCursor =
			hasNextPage && items.length > 0
				? {
						createdAt: items[items.length - 1].rating.createdAt,
						id: items[items.length - 1].rating.id,
					}
				: null;

		const mappedItems = items.map((row) => ({
			...row.rating,
			user: row.user,
			stuff: row.stuff,
			tags: [],
			userVote: null,
		}));

		return {
			items: mappedItems,
			nextCursor,
		};
	},
);
