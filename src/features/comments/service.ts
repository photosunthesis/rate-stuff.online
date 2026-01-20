import { getDatabase } from "~/db";
import { comments, commentVotes, ratings, users } from "~/db/schema";
import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import { createServerOnlyFn } from "@tanstack/react-start";
import type { CreateCommentInput, VoteCommentInput } from "./types";

export const createComment = createServerOnlyFn(
	async (userId: string, input: CreateCommentInput) => {
		const db = getDatabase();

		return db.transaction(async (tx) => {
			const [comment] = await tx
				.insert(comments)
				.values({
					userId,
					ratingId: input.ratingId,
					content: input.content,
				})
				.returning();

			if (!comment) throw new Error("Failed to create comment");

			// Increment comments count on rating
			await tx
				.update(ratings)
				.set({
					commentsCount: sql`${ratings.commentsCount} + 1`,
				})
				.where(eq(ratings.id, input.ratingId));

			// Fetch user details for display
			const user = await tx
				.select()
				.from(users)
				.where(eq(users.id, userId))
				.limit(1)
				.then((res) => res[0]);

			return {
				...comment,
				user: user || null,
			};
		});
	},
);

export const voteOnComment = createServerOnlyFn(
	async (userId: string, input: VoteCommentInput) => {
		const db = getDatabase();

		return db.transaction(async (tx) => {
			const { commentId, type } = input;

			// Check if user owns the comment
			const comment = await tx
				.select()
				.from(comments)
				.where(eq(comments.id, commentId))
				.limit(1)
				.then((res) => res[0]);

			if (!comment) throw new Error("Comment not found");
			if (comment.userId === userId) {
				throw new Error("You cannot vote on your own comment");
			}

			const existingVote = await tx
				.select()
				.from(commentVotes)
				.where(
					and(
						eq(commentVotes.commentId, commentId),
						eq(commentVotes.userId, userId),
					),
				)
				.limit(1)
				.then((res) => res[0]);

			let upvoteChange = 0;
			let downvoteChange = 0;

			if (existingVote) {
				if (existingVote.type === type) {
					// Remove vote
					await tx
						.delete(commentVotes)
						.where(
							and(
								eq(commentVotes.commentId, commentId),
								eq(commentVotes.userId, userId),
							),
						);

					if (type === "up") upvoteChange = -1;
					else downvoteChange = -1;
				} else {
					// Change vote
					await tx
						.update(commentVotes)
						.set({ type })
						.where(
							and(
								eq(commentVotes.commentId, commentId),
								eq(commentVotes.userId, userId),
							),
						);

					if (type === "up") {
						upvoteChange = 1;
						downvoteChange = -1;
					} else {
						upvoteChange = -1;
						downvoteChange = 1;
					}
				}
			} else {
				// New vote
				await tx.insert(commentVotes).values({
					commentId,
					userId,
					type,
				});

				if (type === "up") upvoteChange = 1;
				else downvoteChange = 1;
			}

			// Update counts on comment
			const [updatedComment] = await tx
				.update(comments)
				.set({
					upvotesCount: sql`${comments.upvotesCount} + ${upvoteChange}`,
					downvotesCount: sql`${comments.downvotesCount} + ${downvoteChange}`,
				})
				.where(eq(comments.id, commentId))
				.returning();

			return updatedComment;
		});
	},
);

export const getComments = createServerOnlyFn(
	async (
		ratingId: string,
		limit: number,
		cursor?: { createdAt: Date; id: string },
		currentUserId?: string | null,
	) => {
		const db = getDatabase();

		const cursorFilter = cursor
			? or(
					lt(comments.createdAt, cursor.createdAt),
					and(
						eq(comments.createdAt, cursor.createdAt),
						lt(comments.id, cursor.id),
					),
				)
			: undefined;

		const results = await db
			.select({
				comment: comments,
				user: users,
				userVote: commentVotes.type,
			})
			.from(comments)
			.leftJoin(users, eq(comments.userId, users.id))
			.leftJoin(
				commentVotes,
				and(
					eq(commentVotes.commentId, comments.id),
					currentUserId ? eq(commentVotes.userId, currentUserId) : sql`FALSE`,
				),
			)
			.where(and(eq(comments.ratingId, ratingId), cursorFilter))
			.orderBy(desc(comments.createdAt), desc(comments.id))
			.limit(limit);

		return results.map((r) => ({
			...r.comment,
			user: r.user,
			userVote: r.userVote,
		}));
	},
);
