import { useState, lazy, Suspense } from "react";
import { useCreateComment } from "../queries";
import { ArrowUp, Bold, Italic, Strikethrough, Underline } from "lucide-react";
import { AuthModal } from "~/features/auth/components/auth-modal";

const CompactMarkdownEditor = lazy(() =>
	import("~/components/ui/compact-markdown-editor").then((module) => ({
		default: module.CompactMarkdownEditor,
	})),
);

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
				onSuccess: () => setContent(""),
			},
		);
	};

	return (
		<div className="mb-6 flex gap-3">
			<div className="flex-1 relative group">
				<div className="relative">
					{!isAuthenticated && (
						<button
							type="button"
							className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
							onClick={() => setIsAuthModalOpen(true)}
						>
							<span className="sr-only">Log in to comment</span>
						</button>
					)}
					<div>
						<Suspense fallback={<CompactMarkdownEditorSkeleton />}>
							<CompactMarkdownEditor
								value={content}
								onChange={setContent}
								placeholder={
									isAuthenticated ? "Add a comment..." : "Log in to comment..."
								}
								charLimit={2000}
								minHeightClass="min-h-[80px]"
							/>
						</Suspense>
					</div>

					<div className="absolute bottom-2 right-2 z-10 transition-opacity duration-200">
						<button
							type="button"
							onClick={handleSubmit}
							disabled={!content.trim() || isPending}
							className="bg-neutral-800 hover:bg-emerald-500 disabled:opacity-0 text-white p-2 rounded-lg transition-all flex items-center justify-center shadow-sm"
						>
							<ArrowUp className="w-4 h-4" strokeWidth={2.5} />
						</button>
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

function CompactMarkdownEditorSkeleton() {
	return (
		<div className="animate-pulse">
			<div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900">
				<div className="flex items-center gap-0.5 px-2 py-1.5 bg-neutral-800/80 border-b border-neutral-800 backdrop-blur-sm">
					<div className="p-1 text-neutral-600/50">
						<Bold className="w-3.5 h-3.5" />
					</div>
					<div className="p-1 text-neutral-600/50">
						<Italic className="w-3.5 h-3.5" />
					</div>
					<div className="p-1 text-neutral-600/50">
						<Strikethrough className="w-3.5 h-3.5" />
					</div>
					<div className="p-1 text-neutral-600/50">
						<Underline className="w-3.5 h-3.5" />
					</div>
				</div>

				<div className="h-[80px] bg-neutral-900 w-full" />
			</div>
		</div>
	);
}
