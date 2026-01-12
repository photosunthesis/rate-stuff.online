import { getDb } from "~/db/index";
import { env } from "cloudflare:workers";
import { users, inviteCodes } from "~/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { hashPassword } from "~/utils/auth";
import type { RegisterInput } from "~/features/create-account/types";

export async function createUser(input: RegisterInput) {
	const db = getDb(env);
	const newUser = await db.transaction(async (tx) => {
		const invite = await tx
			.select()
			.from(inviteCodes)
			.where(eq(inviteCodes.code, input.inviteCode))
			.limit(1)
			.then((res) => res[0]);

		if (!invite) throw new Error("Invite code is invalid");
		if (invite.usedBy) throw new Error("Invite code has already been used");

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

		if (existingEmail) throw new Error("Email is already registered");
		if (existingUsername) throw new Error("Username is already taken");

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

		if (!created) throw new Error("Failed to create user");

		const updated = await tx
			.update(inviteCodes)
			.set({ usedBy: created.id, usedAt: new Date() })
			.where(and(eq(inviteCodes.id, invite.id), isNull(inviteCodes.usedBy)))
			.returning();

		// If the invite was used concurrently, abort the transaction
		if (!updated || updated.length === 0)
			throw new Error("Invite code already used");

		return created;
	});

	const { password: _, ...userWithoutPassword } = newUser;

	return userWithoutPassword;
}
