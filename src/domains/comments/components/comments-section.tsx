import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";

interface CommentsSectionProps {
	ratingId: string;
	currentUser: { id: string } | null | undefined;
	className?: string;
}

export function CommentsSection({
	ratingId,
	currentUser,
	className = "",
}: CommentsSectionProps) {
	return (
		<div className={`mt-2 ${className}`}>
			<h3 className="text-md font-semibold text-white mb-2">Comments</h3>
			<CommentForm ratingId={ratingId} currentUser={currentUser} />
			<CommentList ratingId={ratingId} currentUser={currentUser} />
		</div>
	);
}
