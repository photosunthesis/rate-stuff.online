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
			className={`prose prose-invert prose-sm max-w-none [&_p]:mb-0 [&_p]:leading-normal [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-[1.5em] [&_ol]:pl-[1.5em] [&_li]:pl-0 [&_ul]:mt-[1em] [&_ol]:mt-[1em] ${className}`}
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
};
