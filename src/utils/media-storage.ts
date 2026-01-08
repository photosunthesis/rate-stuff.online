const imagesBucketUrl = "https://images.rate-stuff.online/";

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

	return `${imagesBucketUrl}${key}`;
}
export async function deleteFile(env: Env, key: string) {
	await env.rate_stuff_online_r2.delete(key);
}

export async function deleteFileByUrl(env: Env, url: string) {
	let key: string | undefined;
	if (url.startsWith(imagesBucketUrl)) {
		key = url.slice(imagesBucketUrl.length);
	} else {
		try {
			const u = new URL(url);
			key = u.pathname.replace(/^\/+/, "");
		} catch {
			key = undefined;
		}
	}
	if (key) await deleteFile(env, key);
}
export function getFileUrl(key: string): string {
	return `${imagesBucketUrl}${key}`;
}
