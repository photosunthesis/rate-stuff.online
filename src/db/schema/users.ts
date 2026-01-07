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
		email: text("email").notNull().unique(),
		password: text("password").notNull(),
		name: text("name"),
		role: text("role").notNull().default(ROLES.USER).$type<Role>(),
		createdAt: text("created_at")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
		updatedAt: text("updated_at")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
	},
	(table) => [uniqueIndex("email_idx").on(table.email)],
);

export const usersRelations = relations(users, ({ many }) => ({
	ratings: many(ratings),
}));
