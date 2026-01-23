import { useState } from "react";
import { useCreateComment } from "../queries";
import { AuthModal } from "~/features/auth/components/auth-modal";
import { CompactMarkdownEditor } from "~/components/ui/compact-markdown-editor";

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
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const { mutate: createComment, isPending: isCreatePending } =
		useCreateComment();
	const isAuthenticated = !!currentUser;
	const isPending = isCreatePending;
	const [isFocused, setIsFocused] = useState(false);

	const handleSubmit = () => {
		if (!isAuthenticated) {
			setIsAuthModalOpen(true);
			return;
		}

		if (!content.trim() || isPending) return;

		if (isEditing && onSubmit) {
			onSubmit(content);
			return;
		}

		createComment(
			{ ratingId, content },
			{
				onSuccess: () => {
					setContent("");
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
					if (!e.currentTarget.contains(e.relatedTarget as Node)) {
						setIsFocused(false);
					}
				}}
			>
				<div className="relative flex gap-2 items-end flex-wrap">
					{!isAuthenticated && (
						<button
							type="button"
							className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
							onClick={() => setIsAuthModalOpen(true)}
						>
							<span className="sr-only">Sign in to comment</span>
						</button>
					)}
					<div className="w-full">
						<CompactMarkdownEditor
							value={content}
							onChange={setContent}
							placeholder={
								isAuthenticated ? "Add a comment..." : "Sign in to comment..."
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
										className="px-3 py-1.5 text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
									>
										Cancel
									</button>
									<button
										type="button"
										onClick={handleSubmit}
										disabled={!content.trim() || isPending}
										className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed rounded-md transition-colors"
									>
										Update
									</button>
								</div>
							) : (
								<div className="flex w-full justify-end">
									<button
										type="button"
										onClick={handleSubmit}
										disabled={!content.trim() || isPending}
										className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed rounded-md transition-colors"
									>
										Add comment
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
			/>
		</div>
	);
}
