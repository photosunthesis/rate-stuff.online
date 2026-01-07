import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema/index.ts";

export const db = drizzle(env.rate_stuff_online_db, { schema });
