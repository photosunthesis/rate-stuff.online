import { relations } from "drizzle-orm";
import { pgTable, text, real, timestamp, index } from "drizzle-orm/pg-core";
import { stuff } from "./stuff";
import { ratingsToTags } from "./tags";
import { users } from "./auth";

export const ratings = pgTable(
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
		score: real("score").notNull(),
		content: text("content").notNull(),
		images: text("images"),
		createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
		deletedAt: timestamp("deleted_at", { mode: "date" }),
	},
	(table) => [
		index("ratings_created_at_idx").on(table.createdAt),
		index("ratings_user_created_idx").on(table.userId, table.createdAt),
		index("ratings_deleted_at_idx").on(table.deletedAt),
	],
);

export const userRatingsRelations = relations(users, ({ many }) => ({
	users: many(ratings),
}));

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
