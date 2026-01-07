import { sql, relations } from "drizzle-orm";
import { sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { ratings } from "./ratings";

export const tags = sqliteTable("tags", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull().unique(),
	createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
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
	(t) => [primaryKey({ columns: [t.ratingId, t.tagId] })],
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
