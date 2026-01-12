import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { ROLES, type Role } from "./users";
import { safeRandomUUID } from "~/utils/uuid";

export const inviteCodes = pgTable(
	"invite_codes",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => safeRandomUUID()),
		code: text("code").notNull().unique(),
		createdBy: text("created_by")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		role: text("role").notNull().default(ROLES.USER).$type<Role>(),
		usedBy: text("used_by").references(() => users.id, {
			onDelete: "set null",
		}),
		usedAt: timestamp("used_at", { mode: "date" }),
		createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
	},
	(table) => [
		index("created_by_idx").on(table.createdBy),
		index("used_by_idx").on(table.usedBy),
	],
);
