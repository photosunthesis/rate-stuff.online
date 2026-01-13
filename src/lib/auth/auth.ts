import { createServerOnlyFn } from "@tanstack/react-start";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "~/db/db";
import { username } from "better-auth/plugins";
import { createAuthClient } from "better-auth/client";
import { usernameClient } from "better-auth/client/plugins";

const getAuthConfig = createServerOnlyFn(() =>
	betterAuth({
		baseURL: process.env.VITE_BASE_URL,
		telemetry: {
			enabled: false,
		},

		database: drizzleAdapter(db(), {
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

export const auth = getAuthConfig();

const authClient = createAuthClient({
	baseURL: process.env.VITE_BASE_URL,
	plugins: [usernameClient()],
});

export default authClient;
