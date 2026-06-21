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
		// Awaited: on Cloudflare Workers an unawaited promise can be dropped once
		// the response is sent, so a fire-and-forget put may never reach KV.
		await env.KV_CACHE.put(key, JSON.stringify(fresh), { expirationTtl: ttl });
	} catch {}

	return fresh;
}

export async function invalidate(...keys: string[]): Promise<void> {
	await Promise.allSettled(keys.map((key) => env.KV_CACHE.delete(key)));
}
