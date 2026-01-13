import { createServerOnlyFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "~/db/schema";

export const getDatabase = createServerOnlyFn(() => {
	const driver = postgres(env.HYPERDRIVE.connectionString);
	return drizzle({ client: driver, schema, casing: "snake_case" });
});

export const db = getDatabase();
