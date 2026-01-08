import { useId, useEffect } from "react";
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
	placeholder?: string;
}

export function CompactMarkdownEditor({
	label = "Content",
	error,
	id,
	value = "",
	onChange,
	charLimit = 5000,
	placeholder = "Share your thoughts...",
}: CompactMarkdownEditorProps) {
	const generatedId = useId();
	const inputId = id || generatedId;

	const editor = useEditor({
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
			Link.configure({
				openOnClick: false,
				autolink: true,
				defaultProtocol: "https",
				HTMLAttributes: {
					class: "text-emerald-400 underline hover:text-emerald-300",
				},
			}),
			Underline,
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
				class:
					"w-full px-4 py-3 bg-neutral-900 text-md text-white focus:outline-none prose prose-invert prose-sm max-w-none min-h-[150px] [&_.tiptap.ProseMirror]:min-h-[150px] [&_.tiptap.ProseMirror]:outline-none resize-y",
			},
		},
		onUpdate: ({ editor }) => {
			const markdown = (
				editor as EditorWithMarkdown
			).storage.markdown.getMarkdown();
			onChange?.(markdown);
		},
	});

	useEffect(() => {
		if (
			editor &&
			value !== (editor as EditorWithMarkdown).storage.markdown.getMarkdown()
		) {
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
			<label
				htmlFor={inputId}
				className="block text-sm font-medium text-neutral-300 mb-2"
			>
				{label}
			</label>

			<div
				className={`border ${error ? "border-red-400" : "border-neutral-800"} rounded-xl overflow-hidden focus-within:ring-1 ${error ? "focus-within:ring-red-400/40 focus-within:border-red-400" : "focus-within:ring-emerald-600 focus-within:border-emerald-600"} transition-colors`}
			>
				<div className="flex items-center gap-1 px-3 py-2 bg-neutral-800 border-b border-neutral-800">
					<button
						type="button"
						onClick={() => editor?.chain().focus().toggleBold().run()}
						className={`p-1.5 rounded transition-colors ${
							editor?.isActive("bold")
								? "text-white bg-neutral-700"
								: "text-neutral-400 hover:text-white hover:bg-neutral-700"
						}`}
						title="Bold (Ctrl+B)"
					>
						<Bold className="w-4 h-4" />
					</button>
					<button
						type="button"
						onClick={() => editor?.chain().focus().toggleItalic().run()}
						className={`p-1.5 rounded transition-colors ${
							editor?.isActive("italic")
								? "text-white bg-neutral-700"
								: "text-neutral-400 hover:text-white hover:bg-neutral-700"
						}`}
						title="Italic (Ctrl+I)"
					>
						<Italic className="w-4 h-4" />
					</button>
					<button
						type="button"
						onClick={() => editor?.chain().focus().toggleStrike().run()}
						className={`p-1.5 rounded transition-colors ${
							editor?.isActive("strike")
								? "text-white bg-neutral-700"
								: "text-neutral-400 hover:text-white hover:bg-neutral-700"
						}`}
						title="Strikethrough"
					>
						<Strikethrough className="w-4 h-4" />
					</button>
					<button
						type="button"
						onClick={() => editor?.chain().focus().toggleUnderline().run()}
						className={`p-1.5 rounded transition-colors ${
							editor?.isActive("underline")
								? "text-white bg-neutral-700"
								: "text-neutral-400 hover:text-white hover:bg-neutral-700"
						}`}
						title="Underline"
					>
						<UnderlineIcon className="w-4 h-4" />
					</button>
					<div className="ml-auto text-xs text-neutral-500">
						{charCount}/{charLimit}
					</div>
				</div>
				<EditorContent editor={editor} />
			</div>
			{error && <p className="text-red-400 text-sm mt-2">{error}</p>}
		</div>
	);
}
