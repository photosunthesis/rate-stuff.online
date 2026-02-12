import { getDatabase } from "~/db";
import {
	activities,
	comments,
	commentVotes,
	ratings,
	users,
} from "~/db/schema";
import { and, desc, eq, lt, or, sql, isNull } from "drizzle-orm";
import { createServerOnlyFn } from "@tanstack/react-start";
import type {
	CreateCommentInput,
	DeleteCommentInput,
	UpdateCommentInput,
	VoteCommentInput,
} from "./types";
import { createActivity } from "~/domains/activity/service";
import { getQuillTextPreview } from "~/utils/rich-text";

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

			const rating = await tx
				.select()
				.from(ratings)
				.where(and(eq(ratings.id, input.ratingId), isNull(ratings.deletedAt)))
				.limit(1)
				.then((rows) => rows[0]);

			if (!rating) {
				throw new Error("Rating not found or deleted");
			}

			if (!comment) throw new Error("Failed to create comment");

			await tx
				.update(ratings)
				.set({
					commentsCount: sql`${ratings.commentsCount} + 1`,
				})
				.where(eq(ratings.id, input.ratingId));

			const user = await tx
				.select()
				.from(users)
				.where(eq(users.id, userId))
				.limit(1)
				.then((res) => res[0]);

			if (rating.userId !== userId) {
				const preview = getQuillTextPreview(input.content);
				await createActivity(tx, {
					userId: rating.userId,
					actorId: userId,
					type: "comment_create",
					entityId: comment.id,
					entityType: "comment",
					metadata: { preview },
				});
			}

			return {
				...comment,
				user: user || null,
			};
		});
	},
);

export const updateComment = createServerOnlyFn(
	async (userId: string, input: UpdateCommentInput) => {
		const db = getDatabase();

		return db.transaction(async (tx) => {
			const comment = await tx
				.select()
				.from(comments)
				.where(eq(comments.id, input.commentId))
				.limit(1)
				.then((rows) => rows[0]);

			if (!comment) throw new Error("Comment not found");
			if (comment.userId !== userId) {
				throw new Error("You can only edit your own comments");
			}

			const [updatedComment] = await tx
				.update(comments)
				.set({
					content: input.content,
					updatedAt: new Date(),
				})
				.where(eq(comments.id, input.commentId))
				.returning();

			const user = await tx
				.select()
				.from(users)
				.where(eq(users.id, userId))
				.limit(1)
				.then((res) => res[0]);

			return {
				...updatedComment,
				user: user || null,
			};
		});
	},
);

export const deleteComment = createServerOnlyFn(
	async (userId: string, input: DeleteCommentInput) => {
		const db = getDatabase();

		return db.transaction(async (tx) => {
			const comment = await tx
				.select()
				.from(comments)
				.where(eq(comments.id, input.commentId))
				.limit(1)
				.then((rows) => rows[0]);

			if (!comment) throw new Error("Comment not found");
			if (comment.userId !== userId) {
				throw new Error("You can only delete your own comments");
			}

			await tx.delete(comments).where(eq(comments.id, input.commentId));

			await tx
				.update(activities)
				.set({ deletedAt: new Date() })
				.where(
					and(
						eq(activities.entityId, input.commentId),
						eq(activities.entityType, "comment"),
					),
				);

			await tx
				.update(ratings)
				.set({
					commentsCount: sql`${ratings.commentsCount} - 1`,
				})
				.where(eq(ratings.id, comment.ratingId));

			return true;
		});
	},
);

export const voteOnComment = createServerOnlyFn(
	async (userId: string, input: VoteCommentInput) => {
		const db = getDatabase();

		return db.transaction(async (tx) => {
			const { commentId, type } = input;

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
				await tx.insert(commentVotes).values({
					commentId,
					userId,
					type,
				});

				if (type === "up") upvoteChange = 1;
				else downvoteChange = 1;
			}

			const [updatedComment] = await tx
				.update(comments)
				.set({
					upvotesCount: sql`${comments.upvotesCount} + ${upvoteChange}`,
					downvotesCount: sql`${comments.downvotesCount} + ${downvoteChange}`,
				})
				.where(eq(comments.id, commentId))
				.returning();

			const isRemoval = existingVote && existingVote.type === type;

			if (!isRemoval) {
				await createActivity(tx, {
					userId: comment.userId,
					actorId: userId,
					type: "comment_vote",
					entityId: commentId,
					entityType: "comment",
					metadata: { vote: type },
				});
			}

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
			.innerJoin(ratings, eq(comments.ratingId, ratings.id))
			.leftJoin(users, eq(comments.userId, users.id))
			.leftJoin(
				commentVotes,
				and(
					eq(commentVotes.commentId, comments.id),
					currentUserId ? eq(commentVotes.userId, currentUserId) : sql`FALSE`,
				),
			)
			.where(
				and(
					eq(comments.ratingId, ratingId),
					isNull(ratings.deletedAt),
					isNull(comments.deletedAt),
					cursorFilter,
				),
			)
			.orderBy(desc(comments.createdAt), desc(comments.id))
			.limit(limit);

		return results.map((r) => ({
			...r.comment,
			user: r.user,
			userVote: r.userVote,
		}));
	},
);
