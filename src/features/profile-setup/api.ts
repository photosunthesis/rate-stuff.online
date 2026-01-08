import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { ZodError } from "zod";
import {
	profileSetupSchema,
	type PublicUser,
} from "~/features/profile-setup/types";
import { deleteFileByUrl, uploadFile } from "~/utils/media-storage";
import { getSession } from "~/utils/auth";
import { updateUserProfile, getUserById } from "./service";

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
	.inputValidator(profileSetupSchema)
	.handler(async ({ data }) => {
		try {
			const session = await getSession();
			const userId = session?.userId;
			if (!userId) return { success: false, error: "Not authenticated" };

			const updates: { name?: string; avatarUrl?: string } = {};
			const existingUser = await getUserById(userId);

			if (data.displayName && data.displayName.trim() !== "")
				updates.name = data.displayName;

			if (data.avatarUrl === "") {
				if (existingUser?.avatarUrl)
					await deleteFileByUrl(env, existingUser.avatarUrl);
				updates.avatarUrl = undefined;
			} else if (data.avatarUrl) {
				if (
					existingUser?.avatarUrl &&
					existingUser.avatarUrl !== data.avatarUrl
				)
					await deleteFileByUrl(env, existingUser.avatarUrl);
				updates.avatarUrl = data.avatarUrl;
			}

			if (data.avatar) {
				if (!data.avatar.type || !data.avatar.type.startsWith("image/"))
					throw new Error("Invalid file type. Please upload an image.");
				const maxSize = 8 * 1024 * 1024;
				if ((data.avatar as File).size > maxSize)
					throw new Error("File too large. Maximum size is 8MB.");
				const origExt = data.avatar.name.split(".").pop() || "webp";
				const extension =
					data.avatar.type === "image/webp" || origExt.toLowerCase() === "webp"
						? "webp"
						: origExt;
				const avatarKey = `avatars/${userId}-${Date.now()}.${extension}`;
				const uploadedUrl = await uploadFile(env, avatarKey, data.avatar, {
					type: data.avatar.type,
				});
				if (existingUser?.avatarUrl && existingUser.avatarUrl !== uploadedUrl)
					await deleteFileByUrl(env, existingUser.avatarUrl);
				updates.avatarUrl = uploadedUrl;
			}

			const result = await updateUserProfile(
				userId,
				updates as { name?: string; avatarUrl?: string | undefined },
			);
			if (!result.success)
				return {
					success: false,
					error: result.error || "Failed to update profile",
				};
			return { success: true, user: mapUserData(result.data) };
		} catch (error) {
			if (error instanceof ZodError)
				return {
					success: false,
					error: "Validation failed",
					errors: formatZodError(error),
				};
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to update profile",
			};
		}
	});

export const getProfileSummaryFn = createServerFn({ method: "GET" }).handler(
	async () => {
		try {
			const session = await getSession();
			const userId = session?.userId;
			if (!userId) return null;
			const userData = await getUserById(userId);
			if (!userData) return null;
			return {
				displayName: userData.displayName || null,
				avatarUrl: userData.avatarUrl ?? null,
			};
		} catch {
			return null;
		}
	},
);
