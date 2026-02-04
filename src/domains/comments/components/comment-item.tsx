import { Link } from "@tanstack/react-router";
import { Avatar } from "~/components/ui/misc/avatar";
import { RichTextRenderer } from "~/components/ui/content/rich-text-renderer";
import { getPlainTextFromContent } from "~/utils/rich-text";
import { TimeAgo } from "~/components/ui/misc/time-ago";
import { CommentVoteSection } from "./comment-vote-section";
import type { comments, users } from "~/db/schema";
import { useState, useRef, useEffect } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
	Modal,
	ModalClose,
	ModalContent,
	ModalDescription,
	ModalFooter,
	ModalHeader,
	ModalTitle,
} from "~/components/ui/modal/modal";
import { Button } from "~/components/ui/form/button";
import { CommentForm } from "./comment-form";
import { useDeleteComment, useUpdateComment } from "../queries";
import { useUmami } from "@danielgtmn/umami-react";

interface CommentItemProps {
	comment: typeof comments.$inferSelect & {
		user: typeof users.$inferSelect | null;
		userVote: "up" | "down" | null;
	};
	currentUserId?: string;
}

export function CommentItem({ comment, currentUserId }: CommentItemProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const isOwner = currentUserId === comment.userId;
	const usernameHandle = comment.user?.username ?? "unknown";
	const name = comment.user?.name;
	const displayText = name ? name : `@${usernameHandle}`;
	const image = comment.user?.image ?? null;
	const { mutate: updateComment } = useUpdateComment();
	const { mutate: deleteComment, isPending: isDeletePending } =
		useDeleteComment();
	const umami = useUmami();

	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsMenuOpen(false);
			}
		};

		if (isMenuOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isMenuOpen]);

	const plainText = getPlainTextFromContent(comment.content);
	const shouldTruncate =
		plainText.length > 300 || plainText.split("\n").length > 4;

	const handleUpdate = (content: string) => {
		updateComment(
			{ commentId: comment.id, content },
			{
				onSuccess: () => {
					setIsEditing(false);
				},
			},
		);
	};

	const handleDelete = () => {
		deleteComment(
			{ commentId: comment.id },
			{
				onSuccess: () => {
					setIsDeleteModalOpen(false);
					if (umami) umami.track("delete_comment");
				},
			},
		);
	};

	return (
		<div className="flex gap-3 py-1.5 px-2 rounded-lg -mx-2 items-start group/comment">
			<Avatar
				src={image}
				alt={displayText}
				size="sm"
				className="shrink-0 w-8 h-8"
				username={comment.user?.username ?? undefined}
			/>
			<div className="flex-1 min-w-0">
				{isEditing ? (
					<CommentForm
						ratingId={comment.ratingId}
						currentUser={comment.user}
						initialContent={comment.content}
						isEditing={true}
						onCancel={() => setIsEditing(false)}
						onSubmit={handleUpdate}
					/>
				) : (
					<>
						<div className="flex items-center justify-between h-8">
							<div className="flex items-center gap-1">
								{comment.user ? (
									<Link
										to="/user/$username"
										params={{ username: usernameHandle }}
										className="text-white text-base font-medium hover:underline"
									>
										{displayText}
									</Link>
								) : (
									<span className="text-neutral-400 text-base font-medium">
										{displayText}
									</span>
								)}
								<span className="text-neutral-500 text-xs">•</span>
								<TimeAgo
									date={comment.createdAt}
									className="text-neutral-500 text-xs text-nowrap"
								/>
								{comment.updatedAt &&
									comment.updatedAt.getTime() >
										comment.createdAt.getTime() + 1000 && (
										<span className="text-neutral-500 text-xs">(edited)</span>
									)}
							</div>
						</div>

						<div className="mb-1">
							{shouldTruncate && !isExpanded ? (
								<div className="text-slate-200 text-base leading-normal line-clamp-4 relative">
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
										className="absolute bottom-0 right-0 pl-12 bg-linear-to-l from-neutral-950 via-neutral-950 to-transparent text-neutral-500 hover:text-neutral-400 text-base font-semibold transition-colors cursor-pointer ml-1"
									>
										See more
									</button>
								</div>
							) : (
								<div className="text-slate-200 text-base leading-normal">
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
											className="text-neutral-500 hover:text-neutral-400 text-base font-semibold transition-colors cursor-pointer ml-1 block mt-1"
										>
											See less
										</button>
									)}
								</div>
							)}
						</div>

						<div className="flex items-center gap-1">
							<CommentVoteSection
								commentId={comment.id}
								initialUpvotes={comment.upvotesCount}
								initialDownvotes={comment.downvotesCount}
								initialUserVote={comment.userVote}
								isOwner={isOwner}
								isAuthenticated={!!currentUserId}
							/>

							{isOwner && (
								<div className="relative" ref={menuRef}>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											setIsMenuOpen(!isMenuOpen);
										}}
										className="p-1 text-neutral-500 hover:text-white transition-colors hover:bg-neutral-800 rounded-lg"
									>
										<MoreVertical className="w-4 h-4" />
									</button>

									{isMenuOpen && (
										<div className="absolute left-0 bottom-full mb-1 w-32 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl overflow-hidden z-10">
											<button
												type="button"
												onClick={() => {
													setIsMenuOpen(false);
													setIsEditing(true);
												}}
												className="flex items-center gap-2 px-3 py-2 text-base text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors w-full text-left"
											>
												<Pencil className="w-3.5 h-3.5" />
												Edit
											</button>
											<button
												type="button"
												onClick={() => {
													setIsMenuOpen(false);
													setIsDeleteModalOpen(true);
												}}
												className="flex items-center gap-2 px-3 py-2 text-base text-red-400 hover:text-red-300 hover:bg-neutral-800 transition-colors w-full text-left"
											>
												<Trash2 className="w-3.5 h-3.5" />
												Delete
											</button>
										</div>
									)}
								</div>
							)}
						</div>
					</>
				)}
			</div>

			<Modal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
			>
				<ModalContent width="sm">
					<ModalHeader>
						<ModalTitle>Delete this comment?</ModalTitle>
						<ModalDescription>
							Are you sure you want to delete this comment? This action cannot
							be undone.
						</ModalDescription>
					</ModalHeader>
					<ModalFooter>
						<div className="flex w-full gap-2 sm:justify-end">
							<Button
								variant="secondary"
								className="w-full sm:w-auto text-base"
								onClick={() => setIsDeleteModalOpen(false)}
								disabled={isDeletePending}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								className="w-full sm:w-auto text-base"
								onClick={handleDelete}
								isLoading={isDeletePending}
							>
								Delete
							</Button>
						</div>
					</ModalFooter>
					<ModalClose />
				</ModalContent>
			</Modal>
		</div>
	);
}
