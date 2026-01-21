import { Link } from "@tanstack/react-router";
import { Avatar } from "~/components/ui/avatar";
import { RichTextRenderer } from "~/components/ui/rich-text-renderer";
import { getPlainTextFromContent } from "~/utils/rich-text";
import { getTimeAgo } from "~/utils/datetime";
import { CommentVoteSection } from "./comment-vote-section";
import type { comments, users } from "~/db/schema";
import { useState } from "react";

interface CommentItemProps {
	comment: typeof comments.$inferSelect & {
		user: typeof users.$inferSelect | null;
		userVote: "up" | "down" | null;
	};
	currentUserId?: string;
}

export function CommentItem({ comment, currentUserId }: CommentItemProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const isOwner = currentUserId === comment.userId;
	const usernameHandle = comment.user?.username ?? "unknown";
	const name = comment.user?.name;
	const displayText = name ? name : `@${usernameHandle}`;
	const image = comment.user?.image ?? null;

	const plainText = getPlainTextFromContent(comment.content);
	// Show "See more" if content is long (> 300 chars) or has many lines (> 4 newlines)
	const shouldTruncate =
		plainText.length > 300 || plainText.split("\n").length > 4;

	return (
		<div className="flex gap-3 py-1.5 px-2 rounded-lg -mx-2 items-start">
			<Avatar
				src={image}
				alt={displayText}
				size="sm"
				className="shrink-0 w-8 h-8"
				username={comment.user?.username ?? undefined}
			/>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 h-8">
					{comment.user ? (
						<Link
							to="/user/$username"
							params={{ username: usernameHandle }}
							className="text-white text-sm font-medium hover:underline"
						>
							{displayText}
						</Link>
					) : (
						<span className="text-neutral-400 text-sm font-medium">
							{displayText}
						</span>
					)}
					<span className="text-neutral-500 text-xs">•</span>
					<span className="text-neutral-500 text-xs text-nowrap">
						{getTimeAgo(comment.createdAt)}
					</span>
				</div>

				<div className="mb-2">
					{shouldTruncate && !isExpanded ? (
						<div className="text-slate-200 text-sm leading-normal line-clamp-4 relative">
							<RichTextRenderer
								content={comment.content}
								className="[&_p]:mb-3 [&_p]:last-of-type:mb-1 [&_p]:last-of-type:inline"
							/>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									setIsExpanded(true);
								}}
								className="absolute bottom-0 right-0 pl-12 bg-linear-to-l from-neutral-950 via-neutral-950 to-transparent text-neutral-500 hover:text-neutral-400 text-sm font-semibold transition-colors cursor-pointer ml-1"
							>
								See more
							</button>
						</div>
					) : (
						<div className="text-slate-200 text-sm leading-normal">
							<RichTextRenderer
								content={comment.content}
								className="[&_p]:mb-3 [&_p]:last-of-type:mb-1 [&_p]:last-of-type:inline"
							/>
							{shouldTruncate && (
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										setIsExpanded(false);
									}}
									className="text-neutral-500 hover:text-neutral-400 text-sm font-semibold transition-colors cursor-pointer ml-1 block mt-1"
								>
									See less
								</button>
							)}
						</div>
					)}
				</div>

				<CommentVoteSection
					commentId={comment.id}
					initialUpvotes={comment.upvotesCount}
					initialDownvotes={comment.downvotesCount}
					initialUserVote={comment.userVote}
					isOwner={isOwner}
					isAuthenticated={!!currentUserId}
				/>
			</div>
		</div>
	);
}
