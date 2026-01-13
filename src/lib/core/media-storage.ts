import { createServerOnlyFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

const imagesBucketUrl = "https://images.rate-stuff.online";

export const uploadFile = createServerOnlyFn(
	async (
		key: string,
		file: File | Blob | string,
		options?: { type?: string },
	) => {
		await env.R2_BUCKET.put(key, file, {
			httpMetadata: options?.type
				? { contentType: options.type }
				: file instanceof File
					? { contentType: file.type }
					: { contentType: "application/octet-stream" },
		});

		return `${imagesBucketUrl}/${key}`;
	},
);
