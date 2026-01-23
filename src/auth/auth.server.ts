import { createServerOnlyFn } from "@tanstack/react-start";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { username } from "better-auth/plugins";
import { getDatabase, type Database } from "~/db";
import { sendResetPasswordEmail } from "~/utils/email";
import { hashPassword, verifyPassword } from "~/utils/passwords";

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
			expiresIn: 60 * 60 * 24 * 30, // 30 days
			updateAge: 60 * 60 * 24, // 1 day
			cookieCache: {
				enabled: true,
				maxAge: 5 * 60, // 5 minutes
			},
		},

		advanced: {
			defaultCookieAttributes: {
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				httpOnly: true,
			},
		},

		emailAndPassword: {
			enabled: true,
			password: {
				hash: hashPassword,
				verify: verifyPassword,
			},
			sendResetPassword: sendResetPasswordEmail,
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
