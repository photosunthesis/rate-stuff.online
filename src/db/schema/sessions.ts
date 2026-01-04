import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";
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
		expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => [index("sessions_user_id_idx").on(table.userId)],
);
