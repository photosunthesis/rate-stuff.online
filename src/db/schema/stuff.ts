import { relations } from "drizzle-orm";
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { ratings } from "./ratings";
import { users } from "./auth";
import { v7 as uuidv7 } from "uuid";

export const stuff = pgTable("stuff", {
	id: uuid("id")
		.primaryKey()
		.$defaultFn(() => uuidv7()),
	name: text("name").notNull().unique(),
	slug: text("slug").notNull().unique(),
	createdBy: text("created_by")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
		.notNull()
		.defaultNow(),
	deletedAt: timestamp("deleted_at", { mode: "date", withTimezone: true }),
});

export const stuffRelations = relations(stuff, ({ many }) => ({
	ratings: many(ratings),
}));
