import { db } from "~/db/index";
import { users } from "~/db/schema";
import { eq, or } from "drizzle-orm";
import { comparePasswords } from "~/utils/auth-utils";
import type { LoginInput } from "~/features/sign-in/types";

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

export async function authenticateUser(
	input: LoginInput,
): Promise<Result<UserData>> {
	const user = await db.query.users.findFirst({
		where: or(
			eq(users.email, input.identifier),
			eq(users.username, input.identifier),
		),
	});

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
