import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";
import DOMPurify from "dompurify";

export const renderContent = (content: string): string => {
	try {
		const parsed = JSON.parse(content);
		if (parsed.ops && Array.isArray(parsed.ops)) {
			const converter = new QuillDeltaToHtmlConverter(parsed.ops, {
				inlineStyles: true,
			});
			const html = converter.convert();
			return DOMPurify.sanitize(html);
		}
	} catch {}

	return "";
};

export const isQuillDelta = (content: string): boolean => {
	try {
		const parsed = JSON.parse(content);
		return parsed.ops && Array.isArray(parsed.ops);
	} catch {
		return false;
	}
};

export const getPlainTextFromContent = (content: string): string => {
	try {
		const parsed = JSON.parse(content);
		if (parsed.ops && Array.isArray(parsed.ops)) {
			return parsed.ops
				.map((op: { insert?: string }) => op.insert || "")
				.join("");
		}
	} catch {}
	return "";
};

export const getQuillTextPreview = (
	content: string,
	maxLength = 128,
): string => {
	const text = getPlainTextFromContent(content);
	const cleanText = text.trim().replace(/\s+/g, " ");
	if (cleanText.length <= maxLength) return cleanText;
	return `${cleanText.substring(0, maxLength)}...`;
};

export const getPreviewText = (content: string): string => {
	const text = getPlainTextFromContent(content);
	return text.replace(/\n/g, " ").trim().replace(/\s+/g, " ");
};

const INLINE_ATTRS = new Set([
	"bold",
	"italic",
	"strike",
	"underline",
	"link",
	"code",
]);

/**
 * Generates a compact Quill Delta preview from full content.
 * Block structure (headings, lists, paragraph breaks) is collapsed to spaces.
 * Inline formatting (bold, italic, etc.) is preserved.
 * Text is truncated at maxLength characters with "..." appended.
 *
 * Safe to call server-side — no DOM required.
 */
export const generateContentPreview = (
	content: string,
	maxLength = 200,
): string => {
	try {
		const parsed = JSON.parse(content);
		if (!parsed.ops || !Array.isArray(parsed.ops)) return "";

		let charCount = 0;
		const previewOps: Array<{
			insert: string;
			attributes?: Record<string, unknown>;
		}> = [];

		for (const op of parsed.ops) {
			if (typeof op.insert !== "string") continue;

			const text = op.insert.replace(/\n+/g, " ");
			if (!text) continue;

			const attrs =
				op.attributes != null
					? Object.fromEntries(
							Object.entries(
								op.attributes as Record<string, unknown>,
							).filter(([k]) => INLINE_ATTRS.has(k)),
						)
					: undefined;
			const hasAttrs = attrs != null && Object.keys(attrs).length > 0;

			const remaining = maxLength - charCount;
			if (text.length >= remaining) {
				const truncated = `${text.slice(0, remaining).trimEnd()}...`;
				previewOps.push(
					hasAttrs ? { insert: truncated, attributes: attrs } : { insert: truncated },
				);
				break;
			}

			previewOps.push(
				hasAttrs ? { insert: text, attributes: attrs } : { insert: text },
			);
			charCount += text.length;
		}

		if (previewOps.length === 0) return "";
		return JSON.stringify({ ops: previewOps });
	} catch {
		return "";
	}
};
