import { createServerFn } from "@tanstack/react-start";
import { z, ZodError } from "zod";
import {
	profileSetupSchema,
	type PublicUser,
} from "~/features/set-up-profile/types";
import { uploadProfileImage } from "./service";
import { updateUserProfile } from "./service";
import { authMiddleware } from "~/middlewares/auth-middleware";

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

			if (typeof data.avatarUrl === "string" && data.avatarUrl.trim() !== "") {
				updates.avatarUrl = data.avatarUrl;
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

export const uploadAvatarFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator(
		z.preprocess(
			(val) => {
				if (!(val instanceof FormData)) return val;
				return { file: val.get("file") };
			},
			z.object({
				file: z
					.instanceof(File)
					.refine(
						(f) => f.size <= 5 * 1024 * 1024,
						"File size must be less than 5MB",
					)
					.refine((f) => f.type.startsWith("image/"), "File must be an image"),
			}),
		),
	)
	.handler(async ({ data, context }) => {
		try {
			const result = await uploadProfileImage(
				data.file,
				context.userSession.userId,
			);
			return result;
		} catch (error) {
			if (error instanceof ZodError)
				return {
					success: false,
					error: "Validation failed",
					errors: formatZodError(error),
				};
			return {
				success: false,
				error: error instanceof Error ? error.message : "Upload failed",
			};
		}
	});

export const getUserByUsernameFn = createServerFn({ method: "GET" })
	.inputValidator(z.object({ username: z.string() }))
	.handler(async ({ data }) => {
		try {
			const { getUserByUsername } = await import("./service");
			const user = await getUserByUsername(data.username);
			if (!user) return { success: false, error: "Not found" };
			return { success: true, data: user };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to fetch user",
			};
		}
	});
