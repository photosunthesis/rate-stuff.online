import { useEffect, useState } from "react";
import { renderContent } from "~/utils/rich-text";

export const RichTextRenderer = ({
	content,
	className = "",
}: {
	content: string;
	className?: string;
}) => {
	const [html, setHtml] = useState("");

	useEffect(() => {
		let mounted = true;
		renderContent(content).then((rendered) => {
			if (mounted) {
				setHtml(rendered);
			}
		});
		return () => {
			mounted = false;
		};
	}, [content]);

	return (
		<div
			className={`prose prose-invert prose-sm max-w-none [&_p]:mb-0 [&_p]:leading-normal ${className}`}
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
};
