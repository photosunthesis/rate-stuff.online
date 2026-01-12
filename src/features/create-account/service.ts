import { getDb } from "~/db/index";
import { env } from "cloudflare:workers";
import { users, inviteCodes } from "~/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { hashPassword } from "~/utils/auth-utils";
import type { RegisterInput } from "~/features/create-account/types";

type Result<T> =
	| { success: true; data: T }
	| { success: false; error: string; fieldErrors?: Record<string, string> };

type UserData = {
	id: string;
	email: string;
	username: string;
	name: string | null;
	avatarUrl?: string | null;
	role: "user" | "moderator" | "admin";
	createdAt: Date;
	updatedAt: Date;
};

export async function createUser(
	input: RegisterInput,
): Promise<Result<UserData>> {
	try {
		const db = getDb(env);
		const newUser = await db.transaction(async (tx) => {
			const invite = await tx
				.select()
				.from(inviteCodes)
				.where(eq(inviteCodes.code, input.inviteCode))
				.limit(1)
				.then((res) => res[0]);

			if (!invite) throw new Error("INVITE_NOT_FOUND");
			if (invite.usedBy) throw new Error("INVITE_USED");

			// Ensure email/username uniqueness inside the transaction
			const [existingEmail, existingUsername] = await Promise.all([
				tx
					.select()
					.from(users)
					.where(eq(users.email, input.email))
					.limit(1)
					.then((res) => res[0]),
				tx
					.select()
					.from(users)
					.where(eq(users.username, input.username))
					.limit(1)
					.then((res) => res[0]),
			]);

			if (existingEmail) throw new Error("EMAIL_EXISTS");
			if (existingUsername) throw new Error("USERNAME_EXISTS");

			const hashedPassword = await hashPassword(input.password);

			const [created] = await tx
				.insert(users)
				.values({
					email: input.email,
					username: input.username,
					password: hashedPassword,
					role: invite.role,
				})
				.returning();

			if (!created) throw new Error("CREATE_USER_FAILED");

			const updated = await tx
				.update(inviteCodes)
				.set({ usedBy: created.id, usedAt: new Date() })
				.where(and(eq(inviteCodes.id, invite.id), isNull(inviteCodes.usedBy)))
				.returning();

			// If the invite was used concurrently, abort the transaction
			if (!updated || updated.length === 0)
				throw new Error("INVITE_USED_BY_OTHER");

			return created;
		});

		const { password: _, ...userWithoutPassword } = newUser;
		return { success: true, data: userWithoutPassword };
	} catch (err) {
		if (err instanceof Error) {
			if (err?.message === "INVITE_NOT_FOUND") {
				return {
					success: false,
					error: "Invalid invite code",
					fieldErrors: { inviteCode: "This invite code does not exist" },
				};
			}
			if (
				err?.message === "INVITE_USED" ||
				err?.message === "INVITE_USED_BY_OTHER"
			) {
				return {
					success: false,
					error: "Invite code already used",
					fieldErrors: { inviteCode: "This invite code has already been used" },
				};
			}
			if (err?.message === "EMAIL_EXISTS") {
				return {
					success: false,
					error: "Email already registered",
					fieldErrors: { email: "This email is already registered" },
				};
			}
			if (err?.message === "USERNAME_EXISTS") {
				return {
					success: false,
					error: "Username already taken",
					fieldErrors: { username: "This username is already taken" },
				};
			}
		}

		return { success: false, error: "Failed to create user" };
	}
}
