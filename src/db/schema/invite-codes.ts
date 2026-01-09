import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { users } from "./users";
import { ROLES, type Role } from "./users";

export const inviteCodes = sqliteTable(
	"invite_codes",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		code: text("code").notNull().unique(),
		createdBy: text("created_by")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		role: text("role").notNull().default(ROLES.USER).$type<Role>(),
		usedBy: text("used_by").references(() => users.id, {
			onDelete: "set null",
		}),
		usedAt: integer({ mode: "timestamp_ms" }),
		createdAt: integer({ mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [
		index("created_by_idx").on(table.createdBy),
		index("used_by_idx").on(table.usedBy),
	],
);
