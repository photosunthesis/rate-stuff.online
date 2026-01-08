import { relations } from "drizzle-orm";
import { sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { ratings } from "./ratings";

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
			.$defaultFn(() => crypto.randomUUID()),
		username: text("username").notNull(),
		email: text("email").notNull().unique(),
		password: text("password").notNull(),
		name: text("name"),
		avatarKey: text("avatar_key"),
		role: text("role").notNull().default(ROLES.USER).$type<Role>(),
		createdAt: text("created_at")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
		updatedAt: text("updated_at")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
	},
	(table) => [
		uniqueIndex("email_idx").on(table.email),
		uniqueIndex("username_idx").on(table.username),
	],
);

export const usersRelations = relations(users, ({ many }) => ({
	ratings: many(ratings),
}));
