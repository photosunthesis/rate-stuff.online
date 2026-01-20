import { Link } from "@tanstack/react-router";
import { Avatar } from "~/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getTimeAgo } from "~/utils/datetime";
import { CommentVoteSection } from "./comment-vote-section";
import type { comments, users } from "~/db/schema";
import { useState } from "react";
import { truncateMarkdown } from "~/utils/strings";

interface CommentItemProps {
	comment: typeof comments.$inferSelect & {
		user: typeof users.$inferSelect | null;
		userVote: "up" | "down" | null;
	};
	currentUserId?: string;
}

interface MarkdownContentProps {
	content: string;
	inlineParagraphs?: boolean;
}

const MarkdownContent = ({
	content,
	inlineParagraphs,
}: MarkdownContentProps) => {
	const safe = content.replace(/<[^>]*>/g, "");

	return (
		<ReactMarkdown
			remarkPlugins={[remarkGfm]}
			components={{
				p: ({ children }) =>
					inlineParagraphs ? <span>{children}</span> : <p>{children}</p>,
				em: ({ children }) => <em className="italic">{children}</em>,
				strong: ({ children }) => (
					<strong className="font-bold">{children}</strong>
				),
				del: ({ children }) => <del className="line-through">{children}</del>,
				u: ({ children }) => <u className="underline">{children}</u>,
				a: ({ href, children }) => (
					<a
						href={href}
						className="underline underline-offset-2 hover:text-neutral-200"
						target="_blank"
						rel="noopener noreferrer"
						onClick={(e) => e.stopPropagation()}
					>
						{children}
					</a>
				),
			}}
		>
			{safe}
		</ReactMarkdown>
	);
};

export function CommentItem({ comment, currentUserId }: CommentItemProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const isOwner = currentUserId === comment.userId;
	const usernameHandle = comment.user?.username ?? "unknown";
	const name = comment.user?.name;
	const displayText = name ? name : `@${usernameHandle}`;
	const image = comment.user?.image ?? null;
	const maxContentLength = 256;
	const shouldTruncate = comment.content.length > maxContentLength;

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
						<div className="text-slate-200 text-sm leading-normal prose prose-invert prose-sm max-w-none [&_p]:mb-3 [&_p]:leading-normal [&_p:last-of-type]:mb-1 [&_p:last-of-type]:inline">
							<MarkdownContent
								content={truncateMarkdown(comment.content, maxContentLength)}
								inlineParagraphs={true}
							/>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									setIsExpanded(true);
								}}
								className="text-neutral-500 hover:text-neutral-400 text-sm font-semibold transition-colors cursor-pointer ml-1"
							>
								See more
							</button>
						</div>
					) : (
						<div className="text-slate-200 text-sm leading-normal prose prose-invert prose-sm max-w-none [&_p]:mb-3 [&_p]:leading-normal [&_p:last-of-type]:mb-1 [&_p:last-of-type]:inline">
							<MarkdownContent content={comment.content} />
							{shouldTruncate && (
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										setIsExpanded(false);
									}}
									className="text-neutral-500 hover:text-neutral-400 text-sm font-semibold transition-colors cursor-pointer ml-1"
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
