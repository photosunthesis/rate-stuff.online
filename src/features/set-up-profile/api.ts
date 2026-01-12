import { createServerFn, json } from "@tanstack/react-start";
import { z, ZodError } from "zod";
import {
	profileSetupSchema,
	type PublicUser,
} from "~/features/set-up-profile/types";
import { getUserByUsername, uploadProfileImage } from "./service";
import { updateUserProfile } from "./service";
import { authMiddleware } from "~/middlewares/auth-middleware";

function formatZodError(error: ZodError): Record<string, string> {
	const fieldErrors: Record<string, string> = {};

	for (const issue of error.issues) {
		const key = issue.path?.length ? String(issue.path[0]) : "form";
		if (!fieldErrors[key]) fieldErrors[key] = issue.message;
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

			if (data.avatarUrl === "") updates.avatarUrl = undefined;

			if (typeof data.avatarUrl === "string" && data.avatarUrl.trim() !== "")
				updates.avatarUrl = data.avatarUrl;

			const updatedUser = await updateUserProfile(
				userId,
				updates as { name?: string; avatarUrl?: string | undefined },
			);

			return { success: true, user: mapUserData(updatedUser) };
		} catch (error) {
			if (error instanceof ZodError)
				throw json(
					{
						success: false,
						errorMessage: "Validation failed",
						errors: formatZodError(error),
					},
					{ status: 422 },
				);

			throw json(
				{
					success: false,
					errorMessage: import.meta.env.DEV
						? (error as Error).message
						: "Failed to update profile",
				},
				{ status: 500 },
			);
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
				throw json(
					{
						success: false,
						errorMessage: "Validation failed",
						errors: formatZodError(error),
					},
					{ status: 422 },
				);

			throw json(
				{
					success: false,
					errorMessage: import.meta.env.DEV
						? error instanceof Error
							? error.message
							: String(error)
						: "Upload failed",
				},
				{ status: 500 },
			);
		}
	});

export const getUserByUsernameFn = createServerFn({ method: "GET" })
	.inputValidator(z.object({ username: z.string() }))
	.handler(async ({ data }) => {
		try {
			const user = await getUserByUsername(data.username);

			if (!user)
				throw json(
					{ success: false, errorMessage: "Not found" },
					{ status: 404 },
				);

			return { success: true, data: user };
		} catch (error) {
			throw json(
				{
					success: false,
					errorMessage: import.meta.env.DEV
						? error instanceof Error
							? error.message
							: String(error)
						: "Failed to fetch user",
				},
				{ status: 500 },
			);
		}
	});
