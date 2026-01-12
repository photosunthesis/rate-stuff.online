import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export const getDb = (env: Env) => {
	const pool = new Pool({
		connectionString: env.HYPERDRIVE.connectionString,
	});

	return drizzle({ client: pool });
};
