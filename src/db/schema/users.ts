import { sql } from "drizzle-orm";
import {
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

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
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => [uniqueIndex("email_idx").on(table.email)],
);
