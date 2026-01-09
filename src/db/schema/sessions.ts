import { sqliteTable, text, index, integer } from "drizzle-orm/sqlite-core";
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
		expiresAt: integer({ mode: "timestamp_ms" }).notNull(),
		createdAt: integer({ mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [index("sessions_user_id_idx").on(table.userId)],
);
