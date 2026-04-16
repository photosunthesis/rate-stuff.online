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
