import { createServerOnlyFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export const db = createServerOnlyFn((): ReturnType<typeof drizzle> => {
	const pool = new Pool({
		connectionString: env.HYPERDRIVE.connectionString,
	});

	return drizzle({ client: pool });
});
