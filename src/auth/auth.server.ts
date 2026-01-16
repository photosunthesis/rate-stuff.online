import { createServerOnlyFn } from "@tanstack/react-start";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { username } from "better-auth/plugins";
import { getDatabase, type Database } from "~/db";

const getAuthConfig = createServerOnlyFn((db: Database) =>
	betterAuth({
		baseURL: process.env.BETTER_AUTH_URL,
		telemetry: {
			enabled: false,
		},

		database: drizzleAdapter(db, {
			provider: "pg",
			usePlural: true,
		}),

		user: {
			additionalFields: {
				role: {
					type: "string",
					required: true,
					defaultValue: "user",
					input: false,
					returned: true,
				},
			},
		},

		plugins: [tanstackStartCookies(), username()],

		session: {
			cookieCache: {
				enabled: true,
				maxAge: 5 * 60, // 5 minutes
			},
		},

		emailAndPassword: {
			enabled: true,
		},

		experimental: {
			joins: true,
		},
	}),
);

export const getAuth = () => {
	const db = getDatabase();
	return getAuthConfig(db);
};
