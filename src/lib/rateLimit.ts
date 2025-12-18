import { env } from "cloudflare:workers";

interface RateLimitConfig {
	maxAttempts: number;
	lockoutDurationMs: number;
}

interface AttemptData {
	count: number;
	lockedUntil: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
	maxAttempts: 5,
	lockoutDurationMs: 15 * 60 * 1000, // 15 minutes
};

function getKVNamespace(): KVNamespace {
	if (!env.RATE_LIMITS) {
		throw new Error("RATE_LIMITS KV namespace not configured");
	}

	return env.RATE_LIMITS;
}

export async function isRateLimited(
	key: string,
	config: Partial<RateLimitConfig> = {},
): Promise<boolean> {
	const finalConfig = { ...DEFAULT_CONFIG, ...config };

	try {
		const kv = getKVNamespace();
		const data = await kv.get(key, "json");

		if (!data) {
			return false;
		}

		const attemptData = data as AttemptData;
		const now = Date.now();

		if (now > attemptData.lockedUntil) {
			// Lockout period expired, clean up
			await kv.delete(key);
			return false;
		}

		const isLimited = attemptData.count >= finalConfig.maxAttempts;
		return isLimited;
	} catch {
		// Fail open - don't block if KV fails
		return false;
	}
}

export async function recordAttempt(
	key: string,
	config: Partial<RateLimitConfig> = {},
): Promise<void> {
	const finalConfig = { ...DEFAULT_CONFIG, ...config };

	try {
		const kv = getKVNamespace();
		const now = Date.now();
		const ttl = Math.ceil(finalConfig.lockoutDurationMs / 1000); // Convert to seconds

		const existing = await kv.get(key, "json");

		if (!existing) {
			// First attempt
			await kv.put(
				key,
				JSON.stringify({
					count: 1,
					lockedUntil: now + finalConfig.lockoutDurationMs,
				}),
				{ expirationTtl: ttl },
			);
		} else {
			const attemptData = existing as AttemptData;
			if (now > attemptData.lockedUntil) {
				// Lockout period expired, start fresh
				await kv.put(
					key,
					JSON.stringify({
						count: 1,
						lockedUntil: now + finalConfig.lockoutDurationMs,
					}),
					{ expirationTtl: ttl },
				);
			} else {
				// Increment counter
				await kv.put(
					key,
					JSON.stringify({
						count: attemptData.count + 1,
						lockedUntil: attemptData.lockedUntil,
					}),
					{ expirationTtl: ttl },
				);
			}
		}
	} catch {
		// Fail open - don't block if KV fails
	}
}

export async function clearAttempts(key: string): Promise<void> {
	try {
		const kv = getKVNamespace();
		await kv.delete(key);
	} catch {
		// Fail open - don't block if KV fails
	}
}
