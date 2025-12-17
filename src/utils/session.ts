import { useSession } from "@tanstack/react-start/server";

export interface SessionData {
	userId?: string;
}

export function useAppSession() {
	const sessionSecret = process.env.SESSION_SECRET;
	if (!sessionSecret) {
		throw new Error(
			"SESSION_SECRET environment variable is not set. It must be at least 32 characters.",
		);
	}

	return useSession<SessionData>({
		name: "app-session",
		password: sessionSecret,
		cookie: {
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			httpOnly: true,
			maxAge: 7 * 24 * 60 * 60, // 7 days
		},
	});
}

/**
 * Simple in-memory rate limiting for login attempts
 * Note: Use Redis in production for distributed systems
 */
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(ip: string): boolean {
	const now = Date.now();
	const attempts = loginAttempts.get(ip);

	if (!attempts || now > attempts.resetTime) {
		loginAttempts.set(ip, {
			count: 1,
			resetTime: now + 15 * 60 * 1000, // 15 minute window
		});
		return true;
	}

	if (attempts.count >= 5) {
		return false; // Too many attempts
	}

	attempts.count++;
	return true;
}
