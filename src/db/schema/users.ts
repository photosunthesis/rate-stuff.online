import { relations } from "drizzle-orm";
import {
	sqliteTable,
	text,
	uniqueIndex,
	integer,
} from "drizzle-orm/sqlite-core";
import { ratings } from "./ratings";
import { safeRandomUUID } from "~/utils/uuid-utils";

export const ROLES = {
	USER: "user",
	MODERATOR: "moderator",
	ADMIN: "admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const users = sqliteTable(
	"users",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => safeRandomUUID()),
		username: text("username").notNull(),
		email: text("email").notNull().unique(),
		password: text("password").notNull(),
		name: text("name"),
		avatarUrl: text("avatar_url"),
		role: text("role").notNull().default(ROLES.USER).$type<Role>(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [
		uniqueIndex("email_idx").on(table.email),
		uniqueIndex("username_idx").on(table.username),
	],
);

export const usersRelations = relations(users, ({ many }) => ({
	ratings: many(ratings),
}));
