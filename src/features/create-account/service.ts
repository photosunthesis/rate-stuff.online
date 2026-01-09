import { db } from "~/db/index";
import { users, inviteCodes } from "~/db/schema";
import { eq } from "drizzle-orm";
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
	const inviteCode = await db.query.inviteCodes.findFirst({
		where: eq(inviteCodes.code, input.inviteCode),
	});

	if (!inviteCode) {
		return {
			success: false,
			error: "Invalid invite code",
			fieldErrors: { inviteCode: "This invite code does not exist" },
		};
	}

	if (inviteCode.usedBy) {
		return {
			success: false,
			error: "Invite code already used",
			fieldErrors: { inviteCode: "This invite code has already been used" },
		};
	}

	const existingEmail = await db.query.users.findFirst({
		where: eq(users.email, input.email),
	});
	if (existingEmail)
		return {
			success: false,
			error: "Email already registered",
			fieldErrors: { email: "This email is already registered" },
		};

	const existingUsername = await db.query.users.findFirst({
		where: eq(users.username, input.username),
	});
	if (existingUsername)
		return {
			success: false,
			error: "Username already taken",
			fieldErrors: { username: "This username is already taken" },
		};

	const hashedPassword = await hashPassword(input.password);

	const newUser = await db
		.insert(users)
		.values({
			email: input.email,
			username: input.username,
			password: hashedPassword,
			role: inviteCode.role,
		})
		.returning();

	if (!newUser || newUser.length === 0)
		return { success: false, error: "Failed to create user" };

	await db
		.update(inviteCodes)
		.set({ usedBy: newUser[0].id, usedAt: new Date() })
		.where(eq(inviteCodes.id, inviteCode.id));

	const { password: _, ...userWithoutPassword } = newUser[0];
	const userWithDates = {
		...userWithoutPassword,
		createdAt: new Date(userWithoutPassword.createdAt),
		updatedAt: new Date(userWithoutPassword.updatedAt),
	};
	return { success: true, data: userWithDates };
}
