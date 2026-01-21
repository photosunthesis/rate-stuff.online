import { useState } from "react";
import { useCreateComment } from "../queries";
import { Forward } from "lucide-react";
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
}

export function CommentForm({ ratingId, currentUser }: CommentFormProps) {
	const [content, setContent] = useState("");
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const { mutate: createComment, isPending } = useCreateComment();
	const isAuthenticated = !!currentUser;

	const handleSubmit = () => {
		if (!isAuthenticated) {
			setIsAuthModalOpen(true);
			return;
		}

		if (!content.trim() || isPending) return;

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
		<div className="mb-4 flex gap-3">
			<div className="flex-1 relative group">
				<div className="relative flex gap-2 items-end">
					{!isAuthenticated && (
						<button
							type="button"
							className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
							onClick={() => setIsAuthModalOpen(true)}
						>
							<span className="sr-only">Sign in to comment</span>
						</button>
					)}
					<div className="flex-1">
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

					<button
						type="button"
						onClick={handleSubmit}
						disabled={!content.trim() || isPending}
						className="mb-0.5 shrink-0 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:hover:bg-emerald-500/50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-all flex items-center justify-center shadow-sm"
					>
						<Forward className="w-4 h-4" />
					</button>
				</div>
			</div>
			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
			/>
		</div>
	);
}
