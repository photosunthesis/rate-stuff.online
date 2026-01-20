import { useInfiniteQuery } from "@tanstack/react-query";
import { commentsQueryOptions } from "../queries";
import { CommentItem } from "./comment-item";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

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

	const loadMoreRef = useRef<HTMLDivElement>(null);
	// Simple intersection observer implementation since I don't recall precise hook path/signature
	// Actually, let's use standard IntersectionObserver

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

	if (isLoading) {
		return (
			<div className="flex justify-center py-8">
				<Loader2 className="w-6 h-6 animate-spin text-neutral-600" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-8 text-neutral-500 text-sm">
				Failed to load comments.
			</div>
		);
	}

	const allComments = data?.pages.flatMap((page) => page.comments) ?? [];

	if (allComments.length === 0) {
		return (
			<div className="text-center py-8 text-neutral-600 text-sm italic">
				No comments yet. Be the first to share your thoughts!
			</div>
		);
	}

	return (
		<div className="flex flex-col">
			{allComments.map((comment) => (
				<CommentItem
					key={comment.id}
					comment={comment}
					currentUserId={currentUser?.id}
				/>
			))}

			{hasNextPage && (
				<div ref={loadMoreRef} className="flex justify-center py-4">
					{isFetchingNextPage ? (
						<Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
					) : (
						<div className="h-4" />
					)}
				</div>
			)}
		</div>
	);
}
