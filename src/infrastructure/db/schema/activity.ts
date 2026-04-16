import {
	pgTable,
	uuid,
	text,
	timestamp,
	boolean,
	json,
	index,
	pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { v7 as uuidv7 } from "uuid";
import { relations } from "drizzle-orm";

export const activityTypeEnum = pgEnum("activity_type", [
	"rating_vote",
	"comment_vote",
	"comment_create",
]);

export const entityTypeEnum = pgEnum("entity_type", ["rating", "comment"]);

export const activities = pgTable(
	"activities",
	{
		id: uuid("id")
			.primaryKey()
			.$defaultFn(() => uuidv7()),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		actorId: text("actor_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		type: activityTypeEnum("type").notNull(),
		entityId: uuid("entity_id").notNull(),
		entityType: entityTypeEnum("entity_type").notNull(),
		metadata: json("metadata"),
		isRead: boolean("is_read").default(false).notNull(),
		readAt: timestamp("read_at", { mode: "date", withTimezone: true }),
		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		deletedAt: timestamp("deleted_at", {
			mode: "date",
			withTimezone: true,
		}),
	},
	(table) => [
		index("activities_user_created_idx").on(table.userId, table.createdAt),
		index("activities_user_is_read_idx").on(table.userId, table.isRead),
	],
);

export const activitiesRelations = relations(activities, ({ one }) => ({
	user: one(users, {
		fields: [activities.userId],
		references: [users.id],
		relationName: "user_activities",
	}),
	actor: one(users, {
		fields: [activities.actorId],
		references: [users.id],
		relationName: "actor_activities",
	}),
}));
