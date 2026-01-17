import { relations } from "drizzle-orm";
import {
	pgTable,
	uuid,
	real,
	text,
	timestamp,
	index,
	primaryKey,
} from "drizzle-orm/pg-core";
import { stuff } from "./stuff";
import { ratingsToTags } from "./tags";
import { users } from "./auth";
import { v7 as uuidv7 } from "uuid";

export const ratings = pgTable(
	"ratings",
	{
		id: uuid("id")
			.primaryKey()
			.$defaultFn(() => uuidv7()),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		stuffId: uuid("stuff_id")
			.notNull()
			.references(() => stuff.id, { onDelete: "cascade" }),
		score: real("score").notNull(),
		content: text("content").notNull(),
		images: text("images"),
		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
			.notNull()
			.defaultNow(),
		deletedAt: timestamp("deleted_at", { mode: "date", withTimezone: true }),
		upvotesCount: real("upvotes_count").default(1).notNull(),
		downvotesCount: real("downvotes_count").default(0).notNull(),
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
	votes: many(ratingVotes),
}));

export const ratingVotes = pgTable(
	"rating_votes",
	{
		ratingId: uuid("rating_id")
			.notNull()
			.references(() => ratings.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		type: text("type", { enum: ["up", "down"] }).notNull(),
		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
	},
	(table) => [
		// Composite primary key to ensure one vote per user per rating
		index("rating_votes_rating_id_idx").on(table.ratingId),
		index("rating_votes_user_id_idx").on(table.userId),
		primaryKey({ columns: [table.ratingId, table.userId] }),
	],
);

export const ratingVotesRelations = relations(ratingVotes, ({ one }) => ({
	rating: one(ratings, {
		fields: [ratingVotes.ratingId],
		references: [ratings.id],
	}),
	user: one(users, {
		fields: [ratingVotes.userId],
		references: [users.id],
	}),
}));
