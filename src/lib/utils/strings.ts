export const slugify = (s: string) => {
	return s
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
};

export const generateSlug = (
	title?: string,
	maxLength = 128,
	suffixBytes = 3,
) => {
	const SUFFIX = `-${randomSuffix(suffixBytes)}`; // e.g. "-a1b2c3"
	const rawBase = slugify(title || "rating");
	const baseMax = Math.max(1, maxLength - SUFFIX.length);
	const base = rawBase.slice(0, baseMax);
	return `${base}${SUFFIX}`;
};

export const randomSuffix = (bytes = 3) => {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
	const len = Math.max(1, bytes * 2);
	let out = "";
	for (let i = 0; i < len; i++) {
		out += chars[Math.floor(Math.random() * chars.length)];
	}
	return out;
};

export const isEmail = (value: string) =>
	/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
