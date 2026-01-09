import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { ZodError } from "zod";
import {
	profileSetupSchema,
	type PublicUser,
} from "~/features/profile-setup/types";
import { uploadFile } from "~/utils/media-storage-utils";
import { updateUserProfile } from "./service";
import { authMiddleware } from "~/middlewares/auth-middleware";
import crypto from "node:crypto";

function formatZodError(error: ZodError): Record<string, string> {
	const fieldErrors: Record<string, string> = {};
	for (const issue of error.issues) {
		const key = issue.path?.length ? String(issue.path[0]) : "form";
		if (!fieldErrors[key]) {
			fieldErrors[key] = issue.message;
		}
	}
	return fieldErrors;
}

function mapUserData(userData: {
	id: string;
	username: string;
	name?: string | null;
	avatarUrl?: string | null;
}): PublicUser {
	return {
		id: userData.id,
		username: userData.username,
		displayName: userData.name || null,
		avatarUrl: userData.avatarUrl ?? null,
	};
}

export const updateProfileFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator(profileSetupSchema)
	.handler(async ({ data, context }) => {
		try {
			const userId = context.userSession.userId;
			const updates: { name?: string; avatarUrl?: string } = {};

			if (data.displayName && data.displayName.trim() !== "")
				updates.name = data.displayName;

			if (data.avatarUrl === "") {
				updates.avatarUrl = undefined;
			}

			if (data.avatar) {
				if (!data.avatar.type || !data.avatar.type.startsWith("image/")) {
					throw new Error("Invalid file type. Please upload an image.");
				}

				const maxSize = 2 * 1024 * 1024;

				if ((data.avatar as File).size > maxSize) {
					throw new Error("File too large. Maximum size is 2MB.");
				}

				const origExt = data.avatar.name.split(".").pop() || "webp";
				const extension =
					data.avatar.type === "image/webp" || origExt.toLowerCase() === "webp"
						? "webp"
						: origExt;
				const avatarKey = `avatars/${userId}/${crypto.randomUUID()}.${extension}`;
				const uploadedUrl = await uploadFile(env, avatarKey, data.avatar, {
					type: data.avatar.type,
				});

				updates.avatarUrl = uploadedUrl;
			}

			const result = await updateUserProfile(
				userId,
				updates as { name?: string; avatarUrl?: string | undefined },
			);
			if (!result.success) {
				return {
					success: false,
					error: result.error || "Failed to update profile",
				};
			}

			return { success: true, user: mapUserData(result.data) };
		} catch (error) {
			if (error instanceof ZodError) {
				return {
					success: false,
					error: "Validation failed",
					errors: formatZodError(error),
				};
			}

			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to update profile",
			};
		}
	});
