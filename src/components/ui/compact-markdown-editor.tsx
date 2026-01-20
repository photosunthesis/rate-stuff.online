import { useId, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Underline from "@tiptap/extension-underline";
import { Markdown } from "tiptap-markdown";
import {
	Bold,
	Italic,
	Strikethrough,
	Underline as UnderlineIcon,
} from "lucide-react";

interface EditorWithMarkdown extends Editor {
	storage: Editor["storage"] & {
		markdown: {
			getMarkdown: () => string;
		};
	};
}

interface CompactMarkdownEditorProps {
	label?: string;
	error?: string;
	id?: string;
	value?: string;
	onChange?: (value: string) => void;
	charLimit?: number;
	minHeightClass?: string;
	placeholder?: string;
}

export function CompactMarkdownEditor({
	label,
	error,
	id,
	value = "",
	onChange,
	charLimit = 5000,
	minHeightClass = "min-h-[80px]",
	placeholder = "Share your thoughts...",
}: CompactMarkdownEditorProps) {
	const generatedId = useId();
	const inputId = id || generatedId;

	// Refs for debounce and latest callback to avoid re-creating editor
	const debounceTimeoutRef = useRef<NodeJS.Timeout>(null);
	const onChangeRef = useRef(onChange);

	useEffect(() => {
		onChangeRef.current = onChange;
	});

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
			}
		};
	}, []);

	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit.configure({
				blockquote: false,
				bulletList: false,
				codeBlock: false,
				code: false,
				heading: false,
				horizontalRule: false,
				listItem: false,
				orderedList: false,
			}),
			Link.extend({ name: "customLink" }).configure({
				openOnClick: false,
				autolink: true,
				defaultProtocol: "https",
				HTMLAttributes: {
					class: "text-emerald-600 underline hover:text-emerald-500",
				},
			}),
			Underline.extend({ name: "customUnderline" }),
			Markdown,
			Placeholder.configure({
				placeholder,
			}),
			CharacterCount.configure({
				limit: charLimit,
			}),
		],
		content: value,
		editorProps: {
			attributes: {
				class: `w-full px-3 py-2 bg-neutral-900 text-sm text-neutral-200 focus:outline-none prose prose-invert prose-sm max-w-none ${minHeightClass} [&_.tiptap.ProseMirror]:${minHeightClass} [&_.tiptap.ProseMirror]:outline-none resize-y placeholder:text-neutral-500`,
			},
		},
		onUpdate: ({ editor }) => {
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
			}

			debounceTimeoutRef.current = setTimeout(() => {
				const markdown = (
					editor as EditorWithMarkdown
				).storage.markdown.getMarkdown();
				onChangeRef.current?.(normalizeParagraphBreaks(markdown));
			}, 300);
		},
	});

	function normalizeParagraphBreaks(md: string) {
		if (!md) return md;
		// Normalize CRLF to LF
		let s = md.replace(/\r\n/g, "\n");
		// Collapse 3+ newlines into 2
		s = s.replace(/\n{3,}/g, "\n\n");
		// Convert single newlines between non-empty lines into paragraph breaks
		s = s.replace(/([^\n])\n([^\n])/g, "$1\n\n$2");
		return s;
	}

	useEffect(() => {
		if (
			editor &&
			value !== (editor as EditorWithMarkdown).storage.markdown.getMarkdown()
		) {
			// Only update if the content is truly different.
			// However, since we debounce onChange, 'value' might be stale.
			// We risk overwriting user input if we are not careful.
			// But since parent 'value' usually only changes via OUR onChange,
			// and onChange is delayed, 'value' stays effectively constant during typing.
			// So this effect shouldn't fire during typing.
			editor.commands.setContent(value);
		}
	}, [editor, value]);

	const charCount = editor?.storage.characterCount.characters() || 0;

	return (
		<div>
			<style>
				{`
                    .tiptap p.is-editor-empty:first-child::before {
                        color: rgb(115 115 115);
                        content: attr(data-placeholder);
                        float: left;
                        height: 0;
                        pointer-events: none;
                    }
                `}
			</style>
			{label && (
				<label
					htmlFor={inputId}
					className="block text-xs font-medium text-neutral-400 mb-1.5"
				>
					{label}
				</label>
			)}

			<div
				className={`border ${error ? "border-red-400" : "border-neutral-800"} rounded-xl focus-within:ring-1 ${error ? "focus-within:ring-red-400/40 focus-within:border-red-400" : "focus-within:ring-emerald-600/50 focus-within:border-emerald-600/50"} transition-colors bg-neutral-900 group`}
			>
				{/* Compact Toolbar */}
				<div className="flex items-center gap-1.5 px-2 py-1.5 bg-neutral-800/80 border-b border-neutral-800 backdrop-blur-sm rounded-t-[11px]">
					<ToolbarButton
						onClick={() => editor?.chain().focus().toggleBold().run()}
						isActive={editor?.isActive("bold")}
						icon={<Bold className="w-3.5 h-3.5" />}
						title="Bold"
					/>
					<ToolbarButton
						onClick={() => editor?.chain().focus().toggleItalic().run()}
						isActive={editor?.isActive("italic")}
						icon={<Italic className="w-3.5 h-3.5" />}
						title="Italic"
					/>
					<ToolbarButton
						onClick={() => editor?.chain().focus().toggleStrike().run()}
						isActive={editor?.isActive("strike")}
						icon={<Strikethrough className="w-3.5 h-3.5" />}
						title="Strikethrough"
					/>
					<ToolbarButton
						onClick={() => editor?.chain().focus().toggleUnderline().run()}
						isActive={editor?.isActive("underline")}
						icon={<UnderlineIcon className="w-3.5 h-3.5" />}
						title="Underline"
					/>
					<div className="ml-auto text-[10px] sm:text-xs text-neutral-500 font-mono">
						{charCount}/{charLimit}
					</div>
				</div>
				<div className="rounded-b-[11px] overflow-hidden">
					<EditorContent editor={editor} />
				</div>
			</div>
			{error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
		</div>
	);
}

const ToolbarButton = ({
	onClick,
	isActive,
	icon,
	title,
}: {
	onClick: () => void;
	isActive?: boolean;
	icon: React.ReactNode;
	title: string;
}) => {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`p-1 rounded transition-all duration-200 ${
				isActive
					? "text-emerald-400 bg-neutral-700/50"
					: "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/30"
			}`}
			title={title}
		>
			{icon}
		</button>
	);
};
