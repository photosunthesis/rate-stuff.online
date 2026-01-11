import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export function createDb(connectionString?: string) {
	const conn =
		connectionString ??
		process.env.DATABASE_URL ??
		process.env.HYPERDRIVE_CONNECTION_STRING;
	if (!conn) {
		throw new Error(
			"No database connection string provided. Set DATABASE_URL or HYPERDRIVE_CONNECTION_STRING, or pass one to createDb().",
		);
	}
	const pool = new Pool({ connectionString: conn });
	const db = drizzle({ client: pool });
	return { db, pool };
}
