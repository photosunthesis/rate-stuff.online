import { createServerOnlyFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "~/db/schema";

export type Database = ReturnType<typeof drizzle>;

export const getDatabase = createServerOnlyFn(() => {
	return drizzle(env.HYPERDRIVE.connectionString, {
		schema,
		casing: "snake_case",
	});
});
