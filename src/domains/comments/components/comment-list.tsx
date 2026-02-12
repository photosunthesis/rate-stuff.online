import { useInfiniteQuery } from "@tanstack/react-query";
import { commentsQueryOptions } from "../queries";
import type { CommentWithRelations } from "../types";
import { CommentItem } from "./comment-item";
import { CommentSkeleton } from "./comment-skeleton";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";

interface CommentListProps {
	ratingId: string;
	currentUser: { id: string } | null | undefined;
}

export function CommentList({ ratingId, currentUser }: CommentListProps) {
	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		error,
	} = useInfiniteQuery(commentsQueryOptions(ratingId));

	const location = useLocation();
	const [hasScrolled, setHasScrolled] = useState(false);

	const loadMoreRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const element = loadMoreRef.current;
		if (!element || !hasNextPage || isFetchingNextPage) return;

		const observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting) {
				fetchNextPage();
			}
		});

		observer.observe(element);
		return () => observer.disconnect();
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	useEffect(() => {
		if (isLoading || hasScrolled || !location.hash.startsWith("comment-"))
			return;

		const commentId = location.hash.replace("comment-", "");
		const element = document.getElementById(`comment-${commentId}`);

		if (element) {
			setTimeout(() => {
				element.scrollIntoView({ behavior: "smooth", block: "center" });
				setHasScrolled(true);
			}, 100);
		}
	}, [isLoading, location.hash, hasScrolled]);

	if (isLoading) {
		return (
			<div className="flex flex-col">
				<CommentSkeleton />
				<CommentSkeleton />
				<CommentSkeleton />
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-8 text-neutral-500 text-base">
				Failed to load comments.
			</div>
		);
	}

	const allComments =
		data?.pages.flatMap(
			(page: { comments: CommentWithRelations[] }) => page.comments,
		) ?? [];

	if (allComments.length === 0) {
		return (
			<div className="text-center py-8 text-neutral-600 text-base">
				No comments yet ⸜( ´ ꒳ ` )⸝
			</div>
		);
	}

	return (
		<div className="flex flex-col">
			{allComments.map((comment: CommentWithRelations) => (
				<CommentItem
					key={comment.id}
					comment={comment}
					currentUserId={currentUser?.id}
				/>
			))}

			{hasNextPage && (
				<div ref={loadMoreRef} className="flex justify-center py-4">
					<div className="h-4" />
				</div>
			)}
		</div>
	);
}
