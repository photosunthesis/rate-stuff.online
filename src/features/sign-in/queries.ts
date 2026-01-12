import { useMutation } from "@tanstack/react-query";
import type { LoginInput, AuthResponse } from "~/features/sign-in/types";
import authClient from "~/lib/auth/auth-client";
import { z } from "zod";

export function useLoginMutation() {
	return useMutation({
		mutationFn: async (data: LoginInput): Promise<AuthResponse> => {
			const isEmail = z
				.object({
					email: z.email(),
				})
				.safeParse({ email: data.identifier }).success;

			const result = isEmail
				? await authClient.signIn.email({
						email: data.identifier,
						password: data.password,
					})
				: await authClient.signIn.username({
						username: data.identifier,
						password: data.password,
					});

			const user = result.data?.user as
				| {
						id: string;
						email: string;
						emailVerified: boolean;
						username: string;
						displayUsername: string;
						name: string;
						image: string | null | undefined;
						createdAt: Date;
						updatedAt: Date;
				  }
				| null
				| undefined;

			if (user) {
				const publicUser = {
					id: user.id,
					username: user.username ?? user.email ?? "",
					name: user.name ?? null,
					image: user.image ?? null,
				};

				return { success: true, user: publicUser };
			}

			return {
				success: false,
				error: result.error?.message ?? "Login failed",
			};
		},
	});
}
