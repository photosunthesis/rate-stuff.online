import { createServerFn } from "@tanstack/react-start";
import { ZodError } from "zod";
import {
	createCommentSchema,
	deleteCommentSchema,
	getCommentsSchema,
	updateCommentSchema,
	voteCommentSchema,
} from "./types";
import {
	createComment,
	deleteComment,
	getComments,
	updateComment,
	voteOnComment,
} from "./service";
import {
	actionRateLimitMiddleware,
	paginationRateLimitMiddleware,
} from "~/features/rate-limit/middleware";
import {
	authMiddleware,
	optionalAuthMiddleware,
} from "~/features/auth/middleware";

function parseCursor(cursor?: string) {
	if (!cursor) return undefined;
	const [datePart, id] = cursor.split("|");
	if (!datePart || !id) return undefined;
	const createdAt = new Date(datePart);
	if (Number.isNaN(createdAt.getTime())) return undefined;
	return { createdAt, id };
}

function makeCursor(createdAt: Date | string | number, id: string) {
	return `${new Date(createdAt).toISOString()}|${id}`;
}

export const createCommentFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware, actionRateLimitMiddleware])
	.inputValidator(createCommentSchema)
	.handler(async ({ data, context }) => {
		try {
			const comment = await createComment(context.user.id, data);
			return { success: true, data: comment };
		} catch (error) {
			if (error instanceof ZodError) {
				return { success: false, errorMessage: "Validation failed" };
			}
			return {
				success: false,
				errorMessage:
					error instanceof Error ? error.message : "Failed to create comment",
			};
		}
	});

export const updateCommentFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware, actionRateLimitMiddleware])
	.inputValidator(updateCommentSchema)
	.handler(async ({ data, context }) => {
		try {
			const updatedComment = await updateComment(context.user.id, data);
			return { success: true, data: updatedComment };
		} catch (error) {
			return {
				success: false,
				errorMessage:
					error instanceof Error ? error.message : "Failed to update comment",
			};
		}
	});

export const deleteCommentFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware, actionRateLimitMiddleware])
	.inputValidator(deleteCommentSchema)
	.handler(async ({ data, context }) => {
		try {
			await deleteComment(context.user.id, data);
			return { success: true };
		} catch (error) {
			return {
				success: false,
				errorMessage:
					error instanceof Error ? error.message : "Failed to delete comment",
			};
		}
	});

export const voteCommentFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware, actionRateLimitMiddleware])
	.inputValidator(voteCommentSchema)
	.handler(async ({ data, context }) => {
		try {
			const updatedComment = await voteOnComment(context.user.id, data);
			return { success: true, data: updatedComment };
		} catch (error) {
			return {
				success: false,
				errorMessage:
					error instanceof Error ? error.message : "Failed to vote on comment",
			};
		}
	});

export const getCommentsFn = createServerFn({ method: "GET" })
	.middleware([optionalAuthMiddleware, paginationRateLimitMiddleware])
	.inputValidator(getCommentsSchema)
	.handler(async ({ data, context }) => {
		try {
			const userId = context.user?.id;
			const cursor = parseCursor(data.cursor);
			const comments = await getComments(
				data.ratingId,
				data.limit,
				cursor,
				userId,
			);

			let nextCursor: string | undefined;
			if (comments.length === data.limit) {
				const last = comments[comments.length - 1];
				nextCursor = makeCursor(last.createdAt, last.id);
			}

			return {
				success: true,
				data: {
					comments,
					nextCursor,
				},
			};
		} catch {
			return {
				success: false,
				errorMessage: "Failed to load comments",
			};
		}
	});
