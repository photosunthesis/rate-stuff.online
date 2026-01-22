import { ratings, ratingVotes } from "~/db/schema/";
import { eq, and, sql, isNull } from "drizzle-orm";
import { createServerOnlyFn } from "@tanstack/react-start";
import { getDatabase } from "~/db";
import type { VoteRatingInput } from "./types";
import { createActivity } from "../activity/service";

export const voteRating = createServerOnlyFn(
	async (userId: string, input: VoteRatingInput) => {
		const db = getDatabase();

		return db.transaction(async (tx) => {
			const { ratingId, vote } = input;

			const existing = await tx
				.select({
					ownerId: ratings.userId,
					currentVote: ratingVotes.type,
				})
				.from(ratings)
				.leftJoin(
					ratingVotes,
					and(
						eq(ratingVotes.ratingId, ratingId),
						eq(ratingVotes.userId, userId),
					),
				)
				.where(and(eq(ratings.id, ratingId), isNull(ratings.deletedAt)))
				.limit(1)
				.then((rows) => rows[0]);

			if (!existing) throw new Error("Rating not found");

			if (existing.ownerId === userId) {
				throw new Error("You cannot vote on your own rating");
			}

			const currentVoteType = existing.currentVote;

			if (vote === "none") {
				if (currentVoteType) {
					await tx
						.delete(ratingVotes)
						.where(
							and(
								eq(ratingVotes.ratingId, ratingId),
								eq(ratingVotes.userId, userId),
							),
						);

					if (currentVoteType === "up") {
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
				if (currentVoteType) {
					if (currentVoteType !== vote) {
						await tx
							.update(ratingVotes)
							.set({ type: vote })
							.where(
								and(
									eq(ratingVotes.ratingId, ratingId),
									eq(ratingVotes.userId, userId),
								),
							);

						if (vote === "up") {
							await tx
								.update(ratings)
								.set({
									upvotesCount: sql`${ratings.upvotesCount} + 1`,
									downvotesCount: sql`greatest(0, ${ratings.downvotesCount} - 1)`,
								})
								.where(eq(ratings.id, ratingId));
						} else {
							await tx
								.update(ratings)
								.set({
									upvotesCount: sql`greatest(0, ${ratings.upvotesCount} - 1`,
									downvotesCount: sql`${ratings.downvotesCount} + 1`,
								})
								.where(eq(ratings.id, ratingId));
						}

						await createActivity(tx, {
							userId: existing.ownerId,
							actorId: userId,
							type: "rating_vote",
							entityId: ratingId,
							entityType: "rating",
							metadata: { vote },
						});
					}
				} else {
					await tx.insert(ratingVotes).values({
						ratingId,
						userId,
						type: vote,
					});

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

					await createActivity(tx, {
						userId: existing.ownerId,
						actorId: userId,
						type: "rating_vote",
						entityId: ratingId,
						entityType: "rating",
						metadata: { vote },
					});
				}
			}
		});
	},
);
