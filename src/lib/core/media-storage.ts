import { createServerOnlyFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

export const imagesBucketUrl = "https://images.rate-stuff.online";

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

export const createPresignedUploadUrl = createServerOnlyFn(
	async (key: string, expiresSeconds = 300) => {
		const expires = String(Math.floor(Date.now() / 1000) + expiresSeconds);
		const secret = env.SESSION_SECRET;
		const encoder = new TextEncoder();
		const keyMaterial = await crypto.subtle.importKey(
			"raw",
			encoder.encode(secret),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		);
		const data = encoder.encode(`${key}|${expires}`);
		const signatureBuffer = await crypto.subtle.sign("HMAC", keyMaterial, data);
		const sig = Array.from(new Uint8Array(signatureBuffer))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");

		const putUrl = `/api/r2-upload?key=${encodeURIComponent(key)}&expires=${expires}&sig=${sig}`;
		const publicUrl = `${imagesBucketUrl}/${key}`;

		return { key, putUrl, publicUrl };
	},
);
