import { useState } from "react";
import { useCreateComment } from "../hooks";
import { useAuthModal } from "~/features/auth/components/auth-modal-provider";
import { CompactMarkdownEditor } from "~/shared/components/ui/compact-markdown-editor";
import { useUmami } from "@danielgtmn/umami-react";

import { m } from "~/paraglide/messages";
interface CommentFormProps {
	ratingId: string;
	currentUser:
		| {
				id: string;
				image?: string | null;
				username?: string | null;
				name?: string | null;
		  }
		| null
		| undefined;
	initialContent?: string;
	onCancel?: () => void;
	onSubmit?: (content: string) => void;
	isEditing?: boolean;
}

export function CommentForm({
	ratingId,
	currentUser,
	initialContent = "",
	onCancel,
	onSubmit,
	isEditing = false,
}: CommentFormProps) {
	const [content, setContent] = useState(initialContent);
	const { openAuthModal } = useAuthModal();
	const { mutate: createComment, isPending: isCreatePending } =
		useCreateComment();
	const isAuthenticated = !!currentUser;
	const isPending = isCreatePending;
	const [isFocused, setIsFocused] = useState(false);
	const umami = useUmami();

	const handleSubmit = () => {
		if (!isAuthenticated) {
			openAuthModal();
			return;
		}

		if (!content.trim() || isPending) return;

		if (isEditing && onSubmit) {
			onSubmit(content);
			if (umami) umami.track("edit_comment");
			return;
		}

		createComment(
			{ ratingId, content },
			{
				onSuccess: () => {
					setContent("");
					setIsFocused(false);
					if (document.activeElement instanceof HTMLElement) {
						document.activeElement.blur();
					}
					if (umami) umami.track("create_comment");
				},
			},
		);
	};

	return (
		<div className="mb-2 flex gap-3">
			{/* biome-ignore lint/a11y/noStaticElementInteractions: Focus management is needed for the form UX */}
			<div
				className="flex-1 relative group"
				onFocus={() => setIsFocused(true)}
				onBlur={(e) => {
					if (
						!e.relatedTarget ||
						!e.currentTarget.contains(e.relatedTarget as Node)
					) {
						setIsFocused(false);
					}
				}}
			>
				<div className="relative flex gap-2 items-end flex-wrap">
					{!isAuthenticated && (
						<button
							type="button"
							className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
							onClick={() => openAuthModal()}
						>
							<span className="sr-only">{m.comment_sign_in_placeholder()}</span>
						</button>
					)}
					<div className="w-full">
						<CompactMarkdownEditor
							value={content}
							onChange={setContent}
							placeholder={
								isAuthenticated
									? m.comment_placeholder()
									: m.comment_sign_in_placeholder()
							}
							charLimit={2000}
							minHeightClass="min-h-[80px]"
							onSubmit={handleSubmit}
						/>
					</div>

					<div
						className={`grid w-full transition-all duration-300 ease-in-out ${
							isFocused || content.trim().length > 0 || isEditing
								? "grid-rows-[1fr] opacity-100"
								: "grid-rows-[0fr] opacity-0"
						}`}
					>
						<div className="overflow-hidden min-h-0">
							{isEditing ? (
								<div className="flex gap-2 w-full justify-end">
									<button
										type="button"
										onClick={onCancel}
										className="px-3 py-1.5 text-base font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-full transition-colors"
									>
										{m.comment_cancel()}
									</button>
									<button
										type="button"
										onClick={handleSubmit}
										disabled={!content.trim() || isPending}
										className="px-3 py-1.5 text-base font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed rounded-full transition-colors"
									>
										{m.comment_update()}
									</button>
								</div>
							) : (
								<div className="flex w-full justify-end">
									<button
										type="button"
										onClick={handleSubmit}
										disabled={!content.trim() || isPending}
										className="px-3 py-1.5 text-base font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed rounded-full transition-colors"
									>
										{m.comment_add()}
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
