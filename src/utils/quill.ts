export const getQuillTextPreview = (
	content: string,
	maxLength = 128,
): string => {
	try {
		const delta = JSON.parse(content);
		if (!delta.ops || !Array.isArray(delta.ops)) {
			// Fallback if not valid Delta JSON
			return content.substring(0, maxLength);
		}

		let text = "";
		// biome-ignore lint/suspicious/noExplicitAny: generic delta ops
		for (const op of delta.ops as any[]) {
			if (typeof op.insert === "string") {
				text += op.insert;
			}
		}

		const cleanText = text.trim().replace(/\s+/g, " ");
		if (cleanText.length <= maxLength) return cleanText;
		return `${cleanText.substring(0, maxLength)}...`;
	} catch {
		// Not JSON, return as is
		return content.substring(0, maxLength);
	}
};
