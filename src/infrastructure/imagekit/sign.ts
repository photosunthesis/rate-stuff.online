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

// --- Cached key + constants ---
const encoder = new TextEncoder();
const endpoint = (import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT as string).replace(
	/\/$/,
	"",
);
const endpointWithSlash = `${endpoint}/`;

let cachedKey: CryptoKey | null = null;

async function getSigningKey(): Promise<CryptoKey | null> {
	if (cachedKey) return cachedKey;
	const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
	if (!privateKey) return null;
	cachedKey = await crypto.subtle.importKey(
		"raw",
		encoder.encode(privateKey),
		{ name: "HMAC", hash: "SHA-1" },
		false,
		["sign"],
	);
	return cachedKey;
}

// Per-request deduplication cache — same URL always produces the same signature
const signatureCache = new Map<string, string>();

/**
 * Signs an ImageKit URL using HMAC-SHA1 with the private key.
 * The CryptoKey is imported once and reused across calls.
 * Identical URLs within the same request are deduplicated via an in-memory Map.
 */
async function signUrl(url: string): Promise<string> {
	const cached = signatureCache.get(url);
	if (cached) return cached;

	const key = await getSigningKey();
	if (!key) return url;

	// ImageKit signing algorithm (from SDK source):
	// 1. Remove the URL endpoint (with trailing slash) from the full URL
	// 2. Append the DEFAULT_TIMESTAMP "9999999999" (always, even for "no expiry" URLs)
	// 3. ik-t is NOT added to the URL when using the default timestamp
	const stringToSign = `${url.replace(endpointWithSlash, "")}9999999999`;

	const signatureBuffer = await crypto.subtle.sign(
		"HMAC",
		key,
		encoder.encode(stringToSign),
	);
	const sig = Array.from(new Uint8Array(signatureBuffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	const signed = `${url}?ik-s=${sig}`;
	signatureCache.set(url, signed);
	return signed;
}

/**
 * Signs multiple ImageKit URLs in a single parallel batch.
 * This is the core optimization — instead of signing URLs one at a time,
 * collect all URLs upfront and sign them in one Promise.all.
 */
async function batchSignUrls(urls: string[]): Promise<Map<string, string>> {
	const results = new Map<string, string>();
	if (urls.length === 0) return results;

	const signed = await Promise.all(urls.map((url) => signUrl(url)));
	for (let i = 0; i < urls.length; i++) {
		results.set(urls[i], signed[i]);
	}
	return results;
}

function buildImageKitUrl(r2Url: string, transformation: string): string {
	const path = r2Url.replace(`${imagesBucketUrl}/`, "");
	return `${endpoint}/${transformation}/${path}`;
}

function parseImagesJson(imagesJson: string | null | undefined): string[] {
	if (!imagesJson) return [];
	try {
		const parsed = JSON.parse(imagesJson);
		return Array.isArray(parsed) ? (parsed as string[]) : [];
	} catch {
		return [];
	}
}

// ---- Public API: single-item helpers (unchanged signatures) ----

async function buildSignedImagesFromArray(
	r2Urls: string[],
): Promise<SignedImage[]> {
	// Build all URLs that need signing
	const urlPairs = r2Urls.map((r2Url) => ({
		card: buildImageKitUrl(r2Url, TRANSFORMATIONS.card),
		lightbox: buildImageKitUrl(r2Url, TRANSFORMATIONS.lightbox),
	}));

	// Sign everything in one flat batch
	const allUrls = urlPairs.flatMap((p) => [p.card, p.lightbox]);
	const signed = await batchSignUrls(allUrls);

	return urlPairs.map((p) => ({
		// biome-ignore lint/style/noNonNullAssertion: batchSignUrls guarantees all input URLs have entries
		card: signed.get(p.card)!,
		// biome-ignore lint/style/noNonNullAssertion: batchSignUrls guarantees all input URLs have entries
		lightbox: signed.get(p.lightbox)!,
	}));
}

/**
 * Converts a JSON string of R2 image URLs (as stored in the DB) into
 * pre-signed ImageKit URLs for each display variant.
 * Called server-side only; the private key never leaves the server.
 */
export async function buildSignedImages(
	imagesJson: string | null | undefined,
): Promise<SignedImage[]> {
	const r2Urls = parseImagesJson(imagesJson);
	if (r2Urls.length === 0) return [];
	return buildSignedImagesFromArray(r2Urls);
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
 * - R2 URLs (images.rate-stuff.online) -> signed ImageKit avatar URL
 * - OAuth URLs (Google, GitHub, etc.) -> returned unchanged
 * - null/undefined -> null
 *
 * Called server-side only so the private key never reaches the client.
 */
export async function buildSignedAvatarUrl(
	imageUrl: string | null | undefined,
): Promise<string | null> {
	if (!imageUrl) return null;
	if (!imageUrl.startsWith(imagesBucketUrl)) return imageUrl;
	const avatarUrl = buildImageKitUrl(imageUrl, TRANSFORMATIONS.avatar);
	return signUrl(avatarUrl);
}

// ---- Batch API: sign all images + avatars for a list of items in one shot ----

type BatchSignInput = {
	avatarUrl: string | null | undefined;
	imagesJson: string | null | undefined;
};

type BatchSignResult = {
	signedAvatarUrl: string | null;
	signedImages: SignedImage[];
};

/**
 * Signs all avatar + rating images for an entire list of items in a single
 * parallel batch. Use this instead of calling buildSignedAvatarUrl +
 * buildSignedImages per item sequentially.
 *
 * For a feed page with 10 ratings averaging 2 images each:
 *   Before: ~30 sequential crypto.subtle.sign calls
 *   After:  ~30 parallel calls with deduplication + cached key
 */
export async function batchSignItems(
	items: BatchSignInput[],
): Promise<BatchSignResult[]> {
	// 1. Collect every URL that needs signing
	const allUrls: string[] = [];
	const itemMeta: {
		avatarIkUrl: string | null;
		imagePairs: { card: string; lightbox: string }[];
	}[] = [];

	for (const item of items) {
		// Avatar
		let avatarIkUrl: string | null = null;
		if (item.avatarUrl?.startsWith(imagesBucketUrl)) {
			avatarIkUrl = buildImageKitUrl(item.avatarUrl, TRANSFORMATIONS.avatar);
			allUrls.push(avatarIkUrl);
		}

		// Rating images
		const r2Urls = parseImagesJson(item.imagesJson);
		const pairs = r2Urls.map((r2Url) => ({
			card: buildImageKitUrl(r2Url, TRANSFORMATIONS.card),
			lightbox: buildImageKitUrl(r2Url, TRANSFORMATIONS.lightbox),
		}));
		for (const p of pairs) {
			allUrls.push(p.card, p.lightbox);
		}

		itemMeta.push({ avatarIkUrl, imagePairs: pairs });
	}

	// 2. Sign everything in one parallel batch
	const signed = await batchSignUrls(allUrls);

	// 3. Distribute results back
	return items.map((item, i) => {
		const meta = itemMeta[i];

		let signedAvatarUrl: string | null = null;
		if (meta.avatarIkUrl) {
			// biome-ignore lint/style/noNonNullAssertion: batchSignUrls guarantees all input URLs have entries
			signedAvatarUrl = signed.get(meta.avatarIkUrl)!;
		} else if (item.avatarUrl) {
			// Non-R2 avatar (OAuth) — return as-is
			signedAvatarUrl = item.avatarUrl;
		}

		const signedImages: SignedImage[] = meta.imagePairs.map((p) => ({
			// biome-ignore lint/style/noNonNullAssertion: batchSignUrls guarantees all input URLs have entries
			card: signed.get(p.card)!,
			// biome-ignore lint/style/noNonNullAssertion: batchSignUrls guarantees all input URLs have entries
			lightbox: signed.get(p.lightbox)!,
		}));

		return { signedAvatarUrl, signedImages };
	});
}
