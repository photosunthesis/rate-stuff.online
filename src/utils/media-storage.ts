export async function uploadFile(
	env: Env,
	key: string,
	file: File | Blob | string,
	options?: { type?: string },
): Promise<string> {
	await env.rate_stuff_online_r2.put(key, file, {
		httpMetadata: options?.type
			? { contentType: options.type }
			: file instanceof File
				? { contentType: file.type }
				: { contentType: "application/octet-stream" },
	});

	return key;
}

export function getFileUrl(key: string): string {
	// if (import.meta.env.DEV) {
	// 	return `https://images.rate-stuff.online/${key}`;
	// }

	return `https://images.rate-stuff.online/${key}`;
}
