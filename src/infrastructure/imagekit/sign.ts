import { imagesBucketUrl } from "~/infrastructure/file-storage/service";

// Transformation strings must stay in sync with IK_TRANSFORMATIONS in image.tsx
const TRANSFORMATIONS = {
	card: "tr:w-640,q-80,f-webp",
	lightbox: "tr:q-90,f-webp",
	avatar: "tr:h-240,w-240,q-60,f-webp",
} as const;

export type SignedImage = {
	card: string;
	lightbox: string;
};

/**
 * Signs an ImageKit URL using HMAC-SHA1 with the private key.
 * Signs: path_relative_to_endpoint + "9999999999" (ImageKit's DEFAULT_TIMESTAMP).
 * No ik-t is added to the URL — ImageKit uses 9999999999 as the implicit default,
 * so the signed URL is deterministic and CDN cache hits are preserved across all users.
 *
 * If IMAGEKIT_PRIVATE_KEY is absent (local dev without the key) the URL is
 * returned unsigned as a fallback.
 */
async function signUrl(url: string): Promise<string> {
	const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
	if (!privateKey) return url;

	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		encoder.encode(privateKey),
		{ name: "HMAC", hash: "SHA-1" },
		false,
		["sign"],
	);
	// ImageKit signing algorithm (from SDK source):
	// 1. Remove the URL endpoint (with trailing slash) from the full URL
	// 2. Append the DEFAULT_TIMESTAMP "9999999999" (always, even for "no expiry" URLs)
	// 3. ik-t is NOT added to the URL when using the default timestamp
	const endpointWithSlash = (
		import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT as string
	).replace(/\/?$/, "/");
	const stringToSign = url.replace(endpointWithSlash, "") + "9999999999";

	const signatureBuffer = await crypto.subtle.sign(
		"HMAC",
		keyMaterial,
		encoder.encode(stringToSign),
	);
	const sig = Array.from(new Uint8Array(signatureBuffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	return `${url}?ik-s=${sig}`;
}

async function buildSignedImagesFromArray(
	r2Urls: string[],
): Promise<SignedImage[]> {
	const endpoint = (
		import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT as string
	).replace(/\/$/, "");

	return Promise.all(
		r2Urls.map(async (r2Url) => {
			const path = r2Url.replace(`${imagesBucketUrl}/`, "");
			const cardUrl = `${endpoint}/${TRANSFORMATIONS.card}/${path}`;
			const lightboxUrl = `${endpoint}/${TRANSFORMATIONS.lightbox}/${path}`;

			return {
				card: await signUrl(cardUrl),
				lightbox: await signUrl(lightboxUrl),
			};
		}),
	);
}

/**
 * Converts a JSON string of R2 image URLs (as stored in the DB) into
 * pre-signed ImageKit URLs for each display variant.
 * Called server-side only; the private key never leaves the server.
 */
export async function buildSignedImages(
	imagesJson: string | null | undefined,
): Promise<SignedImage[]> {
	if (!imagesJson) return [];

	let r2Urls: unknown;
	try {
		r2Urls = JSON.parse(imagesJson);
	} catch {
		return [];
	}

	if (!Array.isArray(r2Urls)) return [];

	return buildSignedImagesFromArray(r2Urls as string[]);
}

/**
 * Converts a plain array of R2 image URLs into pre-signed ImageKit URLs.
 * Use this when the images are already parsed (not a JSON string).
 */
export async function buildSignedImagesFromUrls(
	r2Urls: string[],
): Promise<SignedImage[]> {
	return buildSignedImagesFromArray(r2Urls);
}

/**
 * Signs an avatar image URL for use in the Image component.
 * - R2 URLs (images.rate-stuff.online) → signed ImageKit avatar URL
 * - OAuth URLs (Google, GitHub, etc.) → returned unchanged
 * - null/undefined → null
 *
 * Called server-side only so the private key never reaches the client.
 */
export async function buildSignedAvatarUrl(
	imageUrl: string | null | undefined,
): Promise<string | null> {
	if (!imageUrl) return null;

	// Non-R2 URLs (OAuth avatars from Google, GitHub, etc.) need no signing
	if (!imageUrl.startsWith(imagesBucketUrl)) return imageUrl;

	const endpoint = (
		import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT as string
	).replace(/\/$/, "");

	const path = imageUrl.replace(`${imagesBucketUrl}/`, "");
	const avatarUrl = `${endpoint}/${TRANSFORMATIONS.avatar}/${path}`;

	return signUrl(avatarUrl);
}
