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
			password: {
				hash: async (password: string) => {
					const encoder = new TextEncoder();
					const salt = crypto.getRandomValues(new Uint8Array(16));
					const keyMaterial = await crypto.subtle.importKey(
						"raw",
						encoder.encode(password),
						{ name: "PBKDF2" },
						false,
						["deriveBits", "deriveKey"],
					);
					const key = await crypto.subtle.deriveKey(
						{
							name: "PBKDF2",
							salt,
							iterations: 100000,
							hash: "SHA-256",
						},
						keyMaterial,
						{ name: "AES-GCM", length: 256 },
						true,
						["encrypt", "decrypt"],
					);
					const exportedKey = (await crypto.subtle.exportKey(
						"raw",
						key,
					)) as ArrayBuffer;
					const hashBuffer = new Uint8Array(exportedKey);
					const saltHex = Array.from(salt)
						.map((b) => b.toString(16).padStart(2, "0"))
						.join("");
					const hashHex = Array.from(hashBuffer)
						.map((b) => b.toString(16).padStart(2, "0"))
						.join("");
					return `${saltHex}:${hashHex}`;
				},
				verify: async ({
					hash: storedHash,
					password,
				}: {
					hash: string;
					password: string;
				}) => {
					const [saltHex, hashHex] = storedHash.split(":");
					const match = saltHex.match(/.{1,2}/g);
					if (!match) return false;
					const salt = new Uint8Array(match.map((byte) => parseInt(byte, 16)));
					const encoder = new TextEncoder();
					const keyMaterial = await crypto.subtle.importKey(
						"raw",
						encoder.encode(password),
						{ name: "PBKDF2" },
						false,
						["deriveBits", "deriveKey"],
					);
					const key = await crypto.subtle.deriveKey(
						{
							name: "PBKDF2",
							salt,
							iterations: 100000,
							hash: "SHA-256",
						},
						keyMaterial,
						{ name: "AES-GCM", length: 256 },
						true,
						["encrypt", "decrypt"],
					);
					const exportedKey = (await crypto.subtle.exportKey(
						"raw",
						key,
					)) as ArrayBuffer;
					const hashBuffer = new Uint8Array(exportedKey);
					const currentHashHex = Array.from(hashBuffer)
						.map((b) => b.toString(16).padStart(2, "0"))
						.join("");
					return currentHashHex === hashHex;
				},
			},
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
