import { pgTable, text, timestamp, index, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { type Role, ROLES } from "./user_roles";
import { v7 as uuidv7 } from "uuid"; // v10+ required

export const inviteCodes = pgTable(
	"invite_codes",
	{
		id: uuid("id")
			.primaryKey()
			.$defaultFn(() => uuidv7()),
		code: text("code").notNull().unique(),
		createdBy: text("created_by")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		role: text("role").notNull().default(ROLES.USER).$type<Role>(),
		usedBy: text("used_by").references(() => users.id, {
			onDelete: "set null",
		}),
		usedAt: timestamp("used_at", { mode: "date", withTimezone: true }),
		createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("created_by_idx").on(table.createdBy),
		index("used_by_idx").on(table.usedBy),
	],
);
