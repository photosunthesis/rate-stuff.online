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

export function normalizeContentType(contentType: string) {
	return contentType.split(";")[0].trim().toLowerCase();
}

export const uploadFile = createServerOnlyFn(
	async (
		r2Bucket: R2Bucket,
		key: string,
		file: File | Blob | string | ArrayBuffer | ArrayBufferView | ReadableStream,
		options?: { type?: string },
	) => {
		const contentType =
			options?.type ??
			(file instanceof File ? file.type : "application/octet-stream");

		const object = await r2Bucket.put(key, file, {
			httpMetadata: { contentType },
		});

		return {
			url: `${imagesBucketUrl}/${key}`,
			size: object?.size ?? 0,
		};
	},
);

async function signUploadPayload(
	key: string,
	userId: string,
	contentType: string,
	expires: string,
) {
	const secret = process.env.BETTER_AUTH_SECRET;
	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const payload = encoder.encode(
		[key, userId, normalizeContentType(contentType), expires].join("|"),
	);
	const signatureBuffer = await crypto.subtle.sign(
		"HMAC",
		keyMaterial,
		payload,
	);
	return Array.from(new Uint8Array(signatureBuffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

function timingSafeEqual(a: string, b: string) {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) {
		diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return diff === 0;
}

export const createPresignedUploadUrl = createServerOnlyFn(
	async (
		key: string,
		userId: string,
		contentType: string,
		expiresSeconds = 900,
	) => {
		const expires = String(Math.floor(Date.now() / 1000) + expiresSeconds);
		const sig = await signUploadPayload(key, userId, contentType, expires);

		const putUrl = `/api/image-upload?key=${encodeURIComponent(key)}&expires=${expires}&sig=${sig}`;
		const publicUrl = `${imagesBucketUrl}/${key}`;

		return { key, putUrl, publicUrl };
	},
);

export async function verifyPresignedUpload(
	key: string,
	expires: string,
	sig: string,
	userId: string,
	contentType: string,
) {
	const now = Math.floor(Date.now() / 1000);
	const expNum = Number(expires);
	if (Number.isNaN(expNum) || now > expNum) {
		return { ok: false, reason: "expired" as const };
	}

	const expected = await signUploadPayload(key, userId, contentType, expires);

	if (!timingSafeEqual(sig, expected)) {
		return { ok: false, reason: "invalid" as const };
	}

	return { ok: true };
}

export const deleteFile = async (r2Bucket: R2Bucket, key: string) => {
	await r2Bucket.delete(key);
};
