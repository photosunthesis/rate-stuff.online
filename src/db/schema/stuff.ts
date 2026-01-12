import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { ratings } from "./ratings";

export const stuff = pgTable("stuff", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull().unique(),
	slug: text("slug").notNull().unique(),
	createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
	deletedAt: timestamp("deleted_at", { mode: "date" }),
});

export const stuffRelations = relations(stuff, ({ many }) => ({
	ratings: many(ratings),
}));
