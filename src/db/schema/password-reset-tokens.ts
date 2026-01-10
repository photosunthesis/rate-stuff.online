import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { users } from "./users";
import { safeRandomUUID } from "~/utils/uuid-utils";

export const passwordResetTokens = sqliteTable(
	"password_reset_tokens",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => safeRandomUUID()),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		token: text("token").notNull().unique(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [index("password_reset_user_id_idx").on(table.userId)],
);
