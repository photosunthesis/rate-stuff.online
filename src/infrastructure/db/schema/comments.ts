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
import { users } from "./auth";
import { ratings } from "./ratings";
import { v7 as uuidv7 } from "uuid";

export const comments = pgTable(
	"comments",
	{
		id: uuid("id")
			.primaryKey()
			.$defaultFn(() => uuidv7()),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		ratingId: uuid("rating_id")
			.notNull()
			.references(() => ratings.id, { onDelete: "cascade" }),
		content: text("content").notNull(),
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
		index("comments_rating_created_idx").on(
			table.ratingId,
			table.createdAt,
			table.id,
		),
		index("comments_user_created_idx").on(
			table.userId,
			table.createdAt,
			table.id,
		),
	],
);

export const commentsRelations = relations(comments, ({ one, many }) => ({
	user: one(users, {
		fields: [comments.userId],
		references: [users.id],
	}),
	rating: one(ratings, {
		fields: [comments.ratingId],
		references: [ratings.id],
	}),
	votes: many(commentVotes),
}));

export const commentVotes = pgTable(
	"comment_votes",
	{
		commentId: uuid("comment_id")
			.notNull()
			.references(() => comments.id, { onDelete: "cascade" }),
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
		index("comment_votes_comment_id_idx").on(table.commentId),
		index("comment_votes_user_id_idx").on(table.userId),
		primaryKey({ columns: [table.commentId, table.userId] }),
	],
);

export const commentVotesRelations = relations(commentVotes, ({ one }) => ({
	comment: one(comments, {
		fields: [commentVotes.commentId],
		references: [comments.id],
	}),
	user: one(users, {
		fields: [commentVotes.userId],
		references: [users.id],
	}),
}));
