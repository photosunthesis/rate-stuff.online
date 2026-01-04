import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { users } from "./users";

export const passwordResetTokens = sqliteTable(
	"password_reset_tokens",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		token: text("token").notNull().unique(),
		expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => [index("password_reset_user_id_idx").on(table.userId)],
);
