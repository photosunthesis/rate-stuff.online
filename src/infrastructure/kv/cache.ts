import { env } from "cloudflare:workers";

export async function cached<T>(
	key: string,
	fetcher: () => Promise<T>,
	ttl = 600,
): Promise<T> {
	try {
		const hit = await env.KV_CACHE.get(key, "json");
		if (hit !== null) return hit as T;
	} catch {}

	const fresh = await fetcher();

	try {
		env.KV_CACHE.put(key, JSON.stringify(fresh), { expirationTtl: ttl });
	} catch {}

	return fresh;
}

export async function invalidate(...keys: string[]): Promise<void> {
	await Promise.allSettled(keys.map((key) => env.KV_CACHE.delete(key)));
}
