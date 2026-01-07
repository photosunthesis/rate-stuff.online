import { sql } from "drizzle-orm";
import { sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { users } from "./users";

export const sessions = sqliteTable(
	"sessions",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		expiresAt: text("expires_at").notNull(),
		createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => [index("sessions_user_id_idx").on(table.userId)],
);
