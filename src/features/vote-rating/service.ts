import { ratings, ratingVotes } from "~/db/schema/";
import { eq, and, sql } from "drizzle-orm";
import { createServerOnlyFn } from "@tanstack/react-start";
import { getDatabase } from "~/db";
import type { VoteRatingInput } from "./types";

export const voteRating = createServerOnlyFn(
	async (userId: string, input: VoteRatingInput) => {
		const db = getDatabase();

		return db.transaction(async (tx) => {
			const { ratingId, vote } = input;

			// Check current vote
			const existingVote = await tx
				.select()
				.from(ratingVotes)
				.where(
					and(
						eq(ratingVotes.ratingId, ratingId),
						eq(ratingVotes.userId, userId),
					),
				)
				.limit(1)
				.then((rows) => rows[0]);

			if (vote === "none") {
				if (existingVote) {
					// Remove vote
					await tx
						.delete(ratingVotes)
						.where(
							and(
								eq(ratingVotes.ratingId, ratingId),
								eq(ratingVotes.userId, userId),
							),
						);

					// Decrement count
					if (existingVote.type === "up") {
						await tx
							.update(ratings)
							.set({
								upvotesCount: sql`greatest(0, ${ratings.upvotesCount} - 1)`,
							})
							.where(eq(ratings.id, ratingId));
					} else {
						await tx
							.update(ratings)
							.set({
								downvotesCount: sql`greatest(0, ${ratings.downvotesCount} - 1)`,
							})
							.where(eq(ratings.id, ratingId));
					}
				}
			} else {
				if (existingVote) {
					if (existingVote.type !== vote) {
						// Change vote
						await tx
							.update(ratingVotes)
							.set({ type: vote })
							.where(
								and(
									eq(ratingVotes.ratingId, ratingId),
									eq(ratingVotes.userId, userId),
								),
							);

						// Update counts (decrement old type, increment new type)
						if (vote === "up") {
							// switched from down to up
							await tx
								.update(ratings)
								.set({
									upvotesCount: sql`${ratings.upvotesCount} + 1`,
									downvotesCount: sql`greatest(0, ${ratings.downvotesCount} - 1)`,
								})
								.where(eq(ratings.id, ratingId));
						} else {
							// switched from up to down
							await tx
								.update(ratings)
								.set({
									upvotesCount: sql`greatest(0, ${ratings.upvotesCount} - 1)`,
									downvotesCount: sql`${ratings.downvotesCount} + 1`,
								})
								.where(eq(ratings.id, ratingId));
						}
					}
					// If type matches, do nothing
				} else {
					// New vote
					await tx.insert(ratingVotes).values({
						ratingId,
						userId,
						type: vote,
					});

					// Increment count
					if (vote === "up") {
						await tx
							.update(ratings)
							.set({ upvotesCount: sql`${ratings.upvotesCount} + 1` })
							.where(eq(ratings.id, ratingId));
					} else {
						await tx
							.update(ratings)
							.set({ downvotesCount: sql`${ratings.downvotesCount} + 1` })
							.where(eq(ratings.id, ratingId));
					}
				}
			}

			// Return updated rating
			const [updatedRating] = await tx
				.select()
				.from(ratings)
				.where(eq(ratings.id, ratingId));

			return updatedRating;
		});
	},
);
