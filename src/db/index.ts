import { createServerOnlyFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "~/db/schema";

export type Database = ReturnType<typeof drizzle>;

export const getDatabase = createServerOnlyFn(() => {
	const client = postgres(env.HYPERDRIVE.connectionString);

	return drizzle(client, {
		schema,
		casing: "snake_case",
	});
});
