import crypto from "node:crypto";

export function slugify(s: string) {
	return s
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

export function generateSlug(title?: string, maxLength = 128, suffixBytes = 3) {
	const SUFFIX = `-${crypto.randomBytes(suffixBytes).toString("hex")}`; // e.g. "-a1b2c3"
	const rawBase = slugify(title || "rating");
	const baseMax = Math.max(1, maxLength - SUFFIX.length);
	const base = rawBase.slice(0, baseMax);
	return `${base}${SUFFIX}`;
}
