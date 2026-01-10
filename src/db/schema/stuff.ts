import { relations } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { ratings } from "./ratings";

export const stuff = sqliteTable("stuff", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull().unique(),
	slug: text("slug").notNull().unique(),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
	deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
});

export const stuffRelations = relations(stuff, ({ many }) => ({
	ratings: many(ratings),
}));
