import { pgTable, text, index, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const sessions = pgTable(
	"sessions",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
		createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
	},
	(table) => [index("sessions_user_id_idx").on(table.userId)],
);
