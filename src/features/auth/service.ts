import { db } from "~/db/index";
import { users, inviteCodes } from "~/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, comparePasswords } from "~/utils/auth";
import type { LoginInput, RegisterInput } from "./types";

type Result<T> =
	| { success: true; data: T }
	| { success: false; error: string; fieldErrors?: Record<string, string> };

type UserData = {
	id: string;
	email: string;
	name: string | null;
	role: "user" | "moderator" | "admin";
	createdAt: Date;
	updatedAt: Date;
};

export async function authenticateUser(
	input: LoginInput,
): Promise<Result<UserData>> {
	let user = await db.query.users.findFirst({
		where: eq(users.email, input.identifier),
	});

	if (!user) {
		user = await db.query.users.findFirst({
			where: eq(users.name, input.identifier),
		});
	}

	if (!user) {
		return {
			success: false,
			error: "Invalid credentials",
			fieldErrors: {
				identifier: "Invalid credentials",
				password: "Invalid credentials",
			},
		};
	}

	const passwordMatches = await comparePasswords(
		input.password,
		user.password || "",
	);

	if (!passwordMatches) {
		return {
			success: false,
			error: "Invalid credentials",
			fieldErrors: {
				identifier: "Invalid credentials",
				password: "Invalid credentials",
			},
		};
	}

	const { password: _, ...userWithoutPassword } = user;
	return { success: true, data: userWithoutPassword };
}

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

	if (existingEmail) {
		return {
			success: false,
			error: "Email already registered",
			fieldErrors: { email: "This email is already registered" },
		};
	}

	const hashedPassword = await hashPassword(input.password);

	const newUser = await db
		.insert(users)
		.values({
			email: input.email,
			password: hashedPassword,
			name: input.displayName,
			role: inviteCode.role,
		})
		.returning();

	if (!newUser || newUser.length === 0) {
		return {
			success: false,
			error: "Failed to create user",
		};
	}

	await db
		.update(inviteCodes)
		.set({ usedBy: newUser[0].id, usedAt: new Date() })
		.where(eq(inviteCodes.id, inviteCode.id));

	const { password: _, ...userWithoutPassword } = newUser[0];
	return { success: true, data: userWithoutPassword };
}

export async function getUserById(userId: string): Promise<UserData | null> {
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
	});

	if (!user) {
		return null;
	}

	const { password: _, ...userWithoutPassword } = user;
	return userWithoutPassword;
}
