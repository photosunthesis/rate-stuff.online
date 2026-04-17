import { Link, useLocation } from "@tanstack/react-router";
import { Avatar } from "~/shared/components/ui/avatar";
import { RichTextRenderer } from "~/shared/components/ui/rich-text-renderer";
import { TimeAgo } from "~/shared/components/ui/time-ago";
import { CommentVoteSection } from "./comment-vote-section";
import type { comments, users } from "~/infrastructure/db/schema";
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
} from "~/shared/components/ui/modal";
import { Button } from "~/shared/components/ui/button";
import { CommentForm } from "./comment-form";
import { useDeleteComment, useUpdateComment } from "../hooks";
import { useUmami } from "@danielgtmn/umami-react";

import { m } from "~/paraglide/messages";
interface CommentItemProps {
	comment: typeof comments.$inferSelect & {
		user: typeof users.$inferSelect | null;
		userVote: "up" | "down" | null;
	};
	currentUserId?: string;
}

export function CommentItem({ comment, currentUserId }: CommentItemProps) {
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
	const location = useLocation();
	const isTargeted = location.hash === `comment-${comment.id}`;
	const [shouldHighlight, setShouldHighlight] = useState(false);

	useEffect(() => {
		if (isTargeted) {
			setShouldHighlight(true);
			const timer = setTimeout(() => {
				setShouldHighlight(false);
			}, 1000);
			return () => clearTimeout(timer);
		}
	}, [isTargeted]);

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
		<div
			id={`comment-${comment.id}`}
			className={`flex gap-3 py-1.5 px-2 rounded-lg -mx-2 items-start group/comment transition-colors duration-300 ${shouldHighlight ? "bg-neutral-800/50" : ""}`}
		>
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
									<span className="text-neutral-300 text-base font-medium">
										{displayText}
									</span>
								)}
								<span className="text-neutral-400 text-base">•</span>
								<TimeAgo
									date={comment.createdAt}
									className="text-neutral-400 text-base text-nowrap"
								/>
								{comment.updatedAt &&
									comment.updatedAt.getTime() >
										comment.createdAt.getTime() + 1000 && (
										<span className="text-neutral-400 text-base">
											{m.comment_edited()}
										</span>
									)}
							</div>
						</div>

						<div className="mb-1">
							<div className="text-slate-200 text-base leading-normal line-clamp-4">
								<RichTextRenderer
									content={comment.content}
									className="[&_p]:inline [&_p]:!m-0 [&_p]:after:content-['_'] [&_br]:hidden"
								/>
							</div>
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
										className="p-1 text-neutral-400 hover:text-white transition-colors hover:bg-neutral-800 rounded-full"
									>
										<MoreVertical className="w-4 h-4" />
									</button>

									{isMenuOpen && (
										<div className="absolute left-0 bottom-full mb-1 w-32 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl overflow-hidden z-10">
											<button
												type="button"
												onClick={() => {
													setIsMenuOpen(false);
													setIsEditing(true);
												}}
												className="flex items-center gap-2 px-3 py-2 text-base text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors w-full text-left"
											>
												<Pencil className="w-3.5 h-3.5" />
												{m.comment_edit_action()}
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
												{m.comment_delete_action()}
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
						<ModalTitle>{m.comment_delete_modal_title()}</ModalTitle>
						<ModalDescription>
							{m.comment_delete_modal_description()}
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
								{m.comment_delete_cancel()}
							</Button>
							<Button
								variant="destructive"
								className="w-full sm:w-auto text-base"
								onClick={handleDelete}
								isLoading={isDeletePending}
							>
								{m.comment_delete_confirm()}
							</Button>
						</div>
					</ModalFooter>
					<ModalClose />
				</ModalContent>
			</Modal>
		</div>
	);
}
