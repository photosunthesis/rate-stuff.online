import { db } from "~/db/index";
import { users } from "~/db/schema";
import { eq, or } from "drizzle-orm";
import { comparePasswords } from "~/utils/auth";
import type { LoginInput } from "~/features/sign-in/types";
import { createServerOnlyFn } from "@tanstack/react-start";

export const authenticateUser = createServerOnlyFn(
	async (input: LoginInput) => {
		const user = await db()
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

		const passwordMatches = await comparePasswords(
			input.password,
			user.password,
		);

		if (!passwordMatches) throw new Error("Invalid credentials");

		const { password: _, ...userWithoutPassword } = user;

		return userWithoutPassword;
	},
);
