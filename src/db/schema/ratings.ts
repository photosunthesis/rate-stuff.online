import { relations } from "drizzle-orm";
import {
	sqliteTable,
	text,
	real,
	integer,
	index,
} from "drizzle-orm/sqlite-core";
import { users } from "./users";
import { stuff } from "./stuff";
import { ratingsToTags } from "./tags";

export const ratings = sqliteTable(
	"ratings",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		stuffId: text("stuff_id")
			.notNull()
			.references(() => stuff.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		score: real("score").notNull(),
		content: text("content").notNull(),
		images: text("images"),
		createdAt: integer({ mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer({ mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		deletedAt: integer({ mode: "timestamp_ms" }),
	},
	(table) => [
		index("ratings_created_at_idx").on(table.createdAt),
		index("ratings_user_created_idx").on(table.userId, table.createdAt),
		index("ratings_deleted_at_idx").on(table.deletedAt),
	],
);

export const ratingsRelations = relations(ratings, ({ one, many }) => ({
	user: one(users, {
		fields: [ratings.userId],
		references: [users.id],
	}),
	stuff: one(stuff, {
		fields: [ratings.stuffId],
		references: [stuff.id],
	}),
	tags: many(ratingsToTags),
}));
