import { createServerOnlyFn } from "@tanstack/react-start";

export const imagesBucketUrl = "https://images.rate-stuff.online";
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_CONTENT_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
	"image/avif",
	"image/heic",
	"image/heif",
];

export const uploadFile = async (
	r2Bucket: R2Bucket,
	key: string,
	file: File | Blob | string | ArrayBuffer | ArrayBufferView,
	options?: { type?: string },
) => {
	const bucket = r2Bucket;
	let body = file;

	// Convert File or Blob to ArrayBuffer to ensure compatibility
	if (file instanceof File || file instanceof Blob) {
		body = await file.arrayBuffer();
	}

	await bucket.put(key, body, {
		httpMetadata: options?.type
			? { contentType: options.type }
			: file instanceof File
				? { contentType: file.type }
				: { contentType: "application/octet-stream" },
	});

	return `${imagesBucketUrl}/${key}`;
};

export const createPresignedUploadUrl = createServerOnlyFn(
	async (key: string, expiresSeconds = 300) => {
		const expires = String(Math.floor(Date.now() / 1000) + expiresSeconds);
		const secret = process.env.BETTER_AUTH_SECRET;
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

		const putUrl = `/api/image-upload?key=${encodeURIComponent(key)}&expires=${expires}&sig=${sig}`;
		const publicUrl = `${imagesBucketUrl}/${key}`;

		return { key, putUrl, publicUrl };
	},
);

export async function verifyPresignedUpload(
	key: string,
	expires: string,
	sig: string,
) {
	const now = Math.floor(Date.now() / 1000);
	const expNum = Number(expires);
	if (Number.isNaN(expNum) || now > expNum) {
		return { ok: false, reason: "expired" as const };
	}

	const secret = process.env.BETTER_AUTH_SECRET;
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
	const expected = Array.from(new Uint8Array(signatureBuffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	if (sig !== expected) {
		return { ok: false, reason: "invalid" as const };
	}

	return { ok: true };
}
