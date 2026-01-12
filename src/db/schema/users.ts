import { relations } from "drizzle-orm";
import { pgTable, text, uniqueIndex, timestamp } from "drizzle-orm/pg-core";
import { ratings } from "./ratings";
import { safeRandomUUID } from "~/utils/uuid-utils";

export const ROLES = {
	USER: "user",
	MODERATOR: "moderator",
	ADMIN: "admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const users = pgTable(
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
		createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("email_idx").on(table.email),
		uniqueIndex("username_idx").on(table.username),
	],
);

export const usersRelations = relations(users, ({ many }) => ({
	ratings: many(ratings),
}));
