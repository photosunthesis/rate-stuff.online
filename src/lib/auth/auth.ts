import { createServerOnlyFn } from "@tanstack/react-start";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "~/db/db";
import * as schema from "~/db/schema/";
import { createAuthMiddleware, username } from "better-auth/plugins";
import { APIError } from "better-auth";
import { inviteCodes } from "~/db/schema/";
import { eq, isNull, and } from "drizzle-orm";

const getAuthConfig = createServerOnlyFn(() =>
	betterAuth({
		baseURL: process.env.VITE_BASE_URL,
		telemetry: {
			enabled: false,
		},

		database: drizzleAdapter(db(), {
			provider: "pg",
			usePlural: true,
			schema,
		}),

		user: {
			additionalFields: {
				role: {
					type: "string",
					required: true,
					defaultValue: "user",
					input: false,
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

		hooks: {
			before: createAuthMiddleware(async (ctx) => {
				if (ctx.path === "/sign-up/email") {
					const inviteCode = await db()
						.select()
						.from(inviteCodes)
						.where(
							and(
								eq(inviteCodes.code, ctx.body?.inviteCode),
								isNull(inviteCodes.usedBy),
								isNull(inviteCodes.usedAt),
							),
						)
						.limit(1)
						.then((res) => res[0]);

					if (!inviteCode) {
						throw new APIError("NOT_FOUND", {
							message: "Invite code is not valid",
						});
					}
				}
			}),
			after: createAuthMiddleware(async (ctx) => {
				if (ctx.path === "/sign-up/email") {
					const inviteCode = await db()
						.select()
						.from(inviteCodes)
						.where(
							and(
								eq(inviteCodes.code, ctx.body?.inviteCode),
								isNull(inviteCodes.usedBy),
								isNull(inviteCodes.usedAt),
							),
						)
						.limit(1)
						.then((res) => res[0]);

					if (inviteCode) {
						const newSession = ctx.context.newSession;

						if (!newSession) return;

						await db()
							.update(inviteCodes)
							.set({
								usedBy: newSession.user.id,
								usedAt: new Date(),
							})
							.where(eq(inviteCodes.id, inviteCode.id));
					}
				}
			}),
		},
	}),
);

export const auth = getAuthConfig();
