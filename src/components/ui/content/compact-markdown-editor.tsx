import { useRef, useEffect, useState, useId } from "react";
import type Quill from "quill";
import "quill/dist/quill.snow.css";
import {
	Bold,
	Italic,
	Strikethrough,
	Underline as UnderlineIcon,
	List,
} from "lucide-react";

interface CompactMarkdownEditorProps {
	label?: string;
	error?: string;
	id?: string;
	value?: string;
	onChange?: (value: string) => void;
	charLimit?: number;
	minHeightClass?: string;
	maxHeightClass?: string;
	placeholder?: string;
	onSubmit?: () => void;
}

export function CompactMarkdownEditor({
	label,
	error,
	id,
	value = "",
	onChange,
	charLimit = 5000,
	minHeightClass = "min-h-[80px]",
	maxHeightClass = "max-h-[300px]",
	placeholder = "Share your thoughts...",
	onSubmit,
}: CompactMarkdownEditorProps) {
	const editorRef = useRef<HTMLDivElement>(null);
	const quillRef = useRef<Quill | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [charCount, setCharCount] = useState(0);
	const reactId = useId();
	const uniqueId = reactId.replace(/:/g, "_");
	const [activeFormats, setActiveFormats] = useState({
		bold: false,
		italic: false,
		strike: false,
		underline: false,
		list: false,
	});

	// Use refs for stable access in useEffect
	const onTextChangeRef = useRef(onChange);
	const initialValueRef = useRef(value);
	const placeholderRef = useRef(placeholder);
	const onSubmitRef = useRef(onSubmit);

	useEffect(() => {
		onTextChangeRef.current = onChange;
		placeholderRef.current = placeholder;
		onSubmitRef.current = onSubmit;
	}, [onChange, placeholder, onSubmit]);

	// Initialize Quill
	useEffect(() => {
		if (editorRef.current && !quillRef.current) {
			import("quill").then(({ default: QuillConstructor }) => {
				if (!editorRef.current || quillRef.current) return;

				const quill = new QuillConstructor(editorRef.current, {
					theme: "snow",
					formats: ["bold", "italic", "strike", "underline", "list"],
					modules: {
						toolbar: false,
						keyboard: {
							bindings: {
								submit: {
									key: 13,
									shiftKey: false,
									handler: () => {
										onSubmitRef.current?.();
										return false;
									},
								},
							},
						},
					},
					placeholder: placeholderRef.current,
				});

				quillRef.current = quill;

				quill.on("text-change", () => {
					const text = quill.getText();
					const isEmpty = text.trim().length === 0;
					setCharCount(isEmpty ? 0 : text.length);

					if (isEmpty) {
						onTextChangeRef.current?.("");
					} else {
						const content = JSON.stringify(quill.getContents());
						onTextChangeRef.current?.(content);
					}
				});

				quill.on("selection-change", (range) => {
					if (range) {
						const formats = quill.getFormat(range);
						setActiveFormats({
							bold: !!formats.bold,
							italic: !!formats.italic,
							strike: !!formats.strike,
							underline: !!formats.underline,
							list: formats.list === "bullet",
						});
					}
				});

				const initialValue = initialValueRef.current;
				if (initialValue) {
					try {
						const delta = JSON.parse(initialValue);
						if (delta.ops) {
							quill.setContents(delta);
						} else {
							quill.setText(initialValue);
						}
					} catch {
						quill.setText(initialValue);
					}
				}
			});
		}
	}, []);

	useEffect(() => {
		if (quillRef.current && value) {
			const currentContent = JSON.stringify(quillRef.current.getContents());
			if (currentContent !== value) {
				try {
					const delta = JSON.parse(value);
					if (delta.ops) {
						quillRef.current.setContents(delta);
					}
				} catch {
					// Ignore
				}
			}
		} else if (quillRef.current && !value) {
			if (quillRef.current.getLength() > 1) {
				quillRef.current.setText("");
			}
		}
	}, [value]);

	const toggleFormat = (format: string) => {
		if (quillRef.current) {
			const current = quillRef.current.getFormat();
			quillRef.current.format(format, !current[format]);

			setActiveFormats((prev) => ({
				...prev,
				[format]: !current[format],
			}));
		}
	};

	const toggleList = () => {
		if (quillRef.current) {
			const current = quillRef.current.getFormat();
			const isList = current.list === "bullet";
			quillRef.current.format("list", isList ? false : "bullet");

			setActiveFormats((prev) => ({
				...prev,
				list: !isList,
			}));
		}
	};

	return (
		<div data-instance-id={uniqueId}>
			{label && (
				<label
					htmlFor={id}
					className="block text-xs font-medium text-neutral-400 mb-1.5"
				>
					{label}
				</label>
			)}

			<div
				ref={containerRef}
				className={`border ${error ? "border-red-400" : "border-neutral-800"} rounded-xl focus-within:ring-1 ${error ? "focus-within:ring-red-400/40 focus-within:border-red-400" : "focus-within:ring-emerald-600/50 focus-within:border-emerald-600/50"} transition-colors bg-neutral-950 group`}
			>
				<div
					className={`flex flex-col rounded-xl overflow-hidden ${minHeightClass} ${maxHeightClass} bg-neutral-950`}
				>
					<div className="flex-1 w-full relative overflow-y-auto">
						<div
							ref={editorRef}
							className="h-full bg-neutral-950 text-neutral-200 [&_.ql-editor]:px-3 [&_.ql-editor]:py-3 [&_.ql-editor]:prose [&_.ql-editor]:prose-invert [&_.ql-editor]:prose-sm [&_.ql-editor]:max-w-none [&_.ql-editor]:focus:outline-none [&_.ql-blank::before]:text-neutral-500 [&_.ql-blank::before]:not-italic"
						/>
					</div>

					<div className="flex-none flex items-center justify-between pl-0.5 pr-3 pt-1 pb-0.5 md:px-2 md:pb-1 border-t border-neutral-800/50">
						<div className="flex items-center gap-1.5">
							<ToolbarButton
								onClick={() => toggleFormat("bold")}
								isActive={activeFormats.bold}
								icon={<Bold className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
								title="Bold"
							/>
							<ToolbarButton
								onClick={() => toggleFormat("italic")}
								isActive={activeFormats.italic}
								icon={<Italic className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
								title="Italic"
							/>
							<ToolbarButton
								onClick={() => toggleFormat("strike")}
								isActive={activeFormats.strike}
								icon={<Strikethrough className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
								title="Strikethrough"
							/>
							<ToolbarButton
								onClick={() => toggleFormat("underline")}
								isActive={activeFormats.underline}
								icon={<UnderlineIcon className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
								title="Underline"
							/>
							<ToolbarButton
								onClick={toggleList}
								isActive={activeFormats.list}
								icon={<List className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
								title="Bullet List"
							/>
						</div>
						<div className="text-xs text-neutral-500 font-mono">
							{charCount}/{charLimit}
						</div>
					</div>
				</div>
			</div>
			{error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}

			<style>{`
				.ql-toolbar { display: none !important; }
				.ql-container.ql-snow { border: none !important; }
				.ql-editor.ql-blank::before { color: #737373; font-style: normal; }
				[data-instance-id='${uniqueId}'] .ql-container,
				[data-instance-id='${uniqueId}'] .ql-editor {
					font-family: var(--font-sans) !important;
				}
				/* Desktop defaults */
				[data-instance-id='${uniqueId}'] .ql-editor,
				[data-instance-id='${uniqueId}'] .ql-editor *,
				[data-instance-id='${uniqueId}'] .ql-editor p,
				[data-instance-id='${uniqueId}'] .ql-editor span {
					font-size: 15px !important;
					line-height: 1.5 !important;
				}

				/* List indentation fix */
				[data-instance-id='${uniqueId}'] .ql-editor ul {
					list-style-type: disc !important;
					padding-left: 1.5em !important;
					margin-top: 1em !important;
				}
				[data-instance-id='${uniqueId}'] .ql-editor ol {
					list-style-type: decimal !important;
					padding-left: 1.5em !important;
					margin-top: 1em !important;
				}
				[data-instance-id='${uniqueId}'] .ql-editor li {
					padding-left: 0 !important;
				}

				/* 
				  Mobile scale trick:
				  1. Force 16px to prevent zoom
				  2. Scale down to 15px (15/16 = 0.9375)
				  3. Compensate width (100 / 0.9375 = 106.67%)
				*/
				@media screen and (max-width: 768px) {
					[data-instance-id='${uniqueId}'] .ql-editor {
						font-size: 16px !important;
						transform: scale(0.9375);
						transform-origin: left top;
						width: 106.67% !important;
						max-width: 106.67% !important;
						overflow-x: hidden; /* Prevent horizontal scroll from width increase */
					}
					/* Ensure child elements inherit the 16px size so they don't break the logic */
					[data-instance-id='${uniqueId}'] .ql-editor *,
					[data-instance-id='${uniqueId}'] .ql-editor p,
					[data-instance-id='${uniqueId}'] .ql-editor span {
						font-size: 16px !important;
					}
				}
			`}</style>
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
			onMouseDown={(e) => {
				e.preventDefault();
				onClick();
			}}
			className={`p-2 sm:p-1 rounded transition-all duration-200 ${
				isActive
					? "text-emerald-500"
					: "text-neutral-400 hover:text-neutral-300"
			}`}
			title={title}
		>
			{icon}
		</button>
	);
};
