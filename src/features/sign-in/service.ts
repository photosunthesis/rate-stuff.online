import { getDb } from "~/db/index";
import { env } from "cloudflare:workers";
import { users } from "~/db/schema";
import { eq, or } from "drizzle-orm";
import { comparePasswords } from "~/utils/auth-utils";
import type { LoginInput } from "~/features/sign-in/types";

export async function authenticateUser(input: LoginInput) {
	const db = getDb(env);
	const user = await db
		.select()
		.from(users)
		.where(
			or(
				eq(users.email, input.identifier),
				eq(users.username, input.identifier),
			),
		)
		.limit(1)
		.then((res) => res[0]);

	if (!user) throw new Error("Invalid credentials");

	const passwordMatches = await comparePasswords(input.password, user.password);

	if (!passwordMatches) throw new Error("Invalid credentials");

	const { password: _, ...userWithoutPassword } = user;

	return userWithoutPassword;
}
