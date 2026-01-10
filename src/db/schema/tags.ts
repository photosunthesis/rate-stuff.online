import { relations } from "drizzle-orm";
import {
	sqliteTable,
	text,
	primaryKey,
	integer,
	index,
} from "drizzle-orm/sqlite-core";
import { ratings } from "./ratings";

export const tags = sqliteTable("tags", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull().unique(),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
	deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
});

export const tagsRelations = relations(tags, ({ many }) => ({
	ratings: many(ratingsToTags),
}));

export const ratingsToTags = sqliteTable(
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
