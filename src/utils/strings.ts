export function maskEmail(email: string): string {
	const [local, domain] = email.split("@");
	if (!local || !domain) return email;

	const maskedLocal =
		local.length > 2
			? `${local.slice(0, 2)}***${local.slice(-1)}`
			: `${local}***`;

	const [domainName, ...domainRest] = domain.split(".");
	const maskedDomainName =
		domainName.length > 2
			? `${domainName.slice(0, 1)}***${domainName.slice(-1)}`
			: `${domainName}***`;

	return `${maskedLocal}@${[maskedDomainName, ...domainRest].join(".")}`;
}

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

export const truncateMarkdown = (content: string, limit: number): string => {
	if (content.length <= limit) return content;

	// Slice the string
	let truncated = content.slice(0, limit);

	// Try to avoid cutting in the middle of a word
	const lastSpace = truncated.lastIndexOf(" ");
	if (lastSpace > limit * 0.8) {
		truncated = truncated.slice(0, lastSpace);
	}

	// Close basic markdown tags to prevent broken rendering
	const stars = (truncated.match(/\*/g) || []).length;
	const doubleStars = (truncated.match(/\*\*/g) || []).length;
	const singleStars = stars - doubleStars * 2;

	const underscores = (truncated.match(/_/g) || []).length;
	const doubleUnderscores = (truncated.match(/__/g) || []).length;
	const singleUnderscores = underscores - doubleUnderscores * 2;

	const codeCount = (truncated.match(/`/g) || []).length;
	const strikeCount = (truncated.match(/~~/g) || []).length;

	let suffix = "";
	if (codeCount % 2 !== 0) suffix += "`";
	if (doubleStars % 2 !== 0) suffix += "**";
	if (singleStars % 2 !== 0) suffix += "*";
	if (doubleUnderscores % 2 !== 0) suffix += "__";
	if (singleUnderscores % 2 !== 0) suffix += "_";
	if (strikeCount % 2 !== 0) suffix += "~~";

	return `${truncated + suffix}...`;
};
