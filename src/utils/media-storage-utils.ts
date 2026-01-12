const imagesBucketUrl = "https://images.rate-stuff.online";

export async function uploadFile(
	env: Env,
	key: string,
	file: File | Blob | string,
	options?: { type?: string },
): Promise<string> {
	await env.R2_BUCKET.put(key, file, {
		httpMetadata: options?.type
			? { contentType: options.type }
			: file instanceof File
				? { contentType: file.type }
				: { contentType: "application/octet-stream" },
	});

	return `${imagesBucketUrl}/${key}`;
}

export function getFileUrl(key: string): string {
	return `${imagesBucketUrl}/${key}`;
}
