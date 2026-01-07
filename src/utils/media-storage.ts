import { env } from "cloudflare:workers";

export async function uploadFile(
	key: string,
	file: File | Blob | string,
	options?: { type?: string },
): Promise<string> {
	await env.rate_stuff_online_r2.put(key, file, {
		httpMetadata: options?.type
			? { contentType: options.type }
			: file instanceof File
				? { contentType: file.type }
				: undefined,
	});
	return key;
}

export function getFileUrl(key: string): string {
	// Serve images through our API endpoint which fetches from R2
	// This works for both dev (wrangler dev) and production
	return `/api/images/${key}`;
}
