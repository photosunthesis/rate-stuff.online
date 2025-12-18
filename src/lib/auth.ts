import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { compare, hash } from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";

const SALT_ROUNDS = 12;

export interface SessionPayload extends Record<string, unknown> {
	userId: string;
	email: string;
	iat?: number;
	exp?: number;
}

function getEncryptionKey(): Uint8Array {
	const secret = process.env.SESSION_SECRET;
	if (!secret || secret.length < 32) {
		throw new Error(
			"SESSION_SECRET environment variable is not set or too short. Must be at least 32 characters.",
		);
	}
	return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
	return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
	plainTextPassword: string,
	hashedPassword: string,
): Promise<boolean> {
	return compare(plainTextPassword, hashedPassword);
}

export async function createToken(payload: SessionPayload): Promise<string> {
	const key = getEncryptionKey();
	const expiresIn = "7d"; // 7 day session

	return await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(expiresIn)
		.sign(key);
}

export async function verifyToken(token: string): Promise<SessionPayload> {
	const key = getEncryptionKey();

	try {
		const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
		return payload as unknown as SessionPayload;
	} catch {
		throw new Error("Invalid or expired session token");
	}
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
	const token = await createToken(payload);
	const isProduction = process.env.NODE_ENV === "production";

	const cookieOptions = [
		`session=${encodeURIComponent(token)}`,
		"Path=/",
		"HttpOnly", // XSS protection
		isProduction ? "Secure" : "", // HTTPS only in production
		"SameSite=Lax", // CSRF protection
		"Max-Age=604800", // 7 days
	]
		.filter(Boolean)
		.join("; ");

	setResponseHeader("Set-Cookie", cookieOptions);
}

/**
 * Clear the session cookie
 */
export function clearSessionCookie(): void {
	setResponseHeader(
		"Set-Cookie",
		"session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0",
	);
}

/**
 * Get the current session from request headers
 * Extracts, decrypts, and validates the JWT token
 */
export async function getSession(): Promise<SessionPayload | null> {
	try {
		const cookieHeader = getRequest().headers.get("cookie");
		if (!cookieHeader) return null;

		const match = cookieHeader.match(/session=([^;]+)/);
		if (!match?.[1]) return null;

		const token = decodeURIComponent(match[1]);
		return await verifyToken(token);
	} catch {
		// Silently fail on invalid token
		return null;
	}
}
