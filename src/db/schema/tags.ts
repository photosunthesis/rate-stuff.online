import { relations } from "drizzle-orm";
import {
	pgTable,
	text,
	primaryKey,
	timestamp,
	index,
} from "drizzle-orm/pg-core";
import { ratings } from "./ratings";
import { safeRandomUUID } from "~/utils/uuid-utils";

export const tags = pgTable("tags", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => safeRandomUUID()),
	name: text("name").notNull().unique(),
	createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
	deletedAt: timestamp("deleted_at", { mode: "date" }),
});

export const tagsRelations = relations(tags, ({ many }) => ({
	ratings: many(ratingsToTags),
}));

export const ratingsToTags = pgTable(
	"ratings_to_tags",
	{
		ratingId: text("rating_id")
			.notNull()
			.references(() => ratings.id, { onDelete: "cascade" }),
		tagId: text("tag_id")
			.notNull()
			.references(() => tags.id, { onDelete: "cascade" }),
	},
	(t) => [
		primaryKey({ columns: [t.ratingId, t.tagId] }),
		index("ratings_to_tags_tag_idx").on(t.tagId),
	],
);

export const ratingsToTagsRelations = relations(ratingsToTags, ({ one }) => ({
	rating: one(ratings, {
		fields: [ratingsToTags.ratingId],
		references: [ratings.id],
	}),
	tag: one(tags, {
		fields: [ratingsToTags.tagId],
		references: [tags.id],
	}),
}));
