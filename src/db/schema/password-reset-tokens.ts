import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const passwordResetTokens = pgTable(
	"password_reset_tokens",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		token: text("token").notNull().unique(),
		expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }),
		createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [index("password_reset_user_id_idx").on(table.userId)],
);
