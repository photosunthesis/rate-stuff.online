import { sql, relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { ratings } from "./ratings";

export const stuff = sqliteTable("stuff", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull().unique(),
	createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
	updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
	deletedAt: text("deleted_at"),
});

export const stuffRelations = relations(stuff, ({ many }) => ({
	ratings: many(ratings),
}));
