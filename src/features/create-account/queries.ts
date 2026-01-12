import { useMutation } from "@tanstack/react-query";
import authClient from "~/lib/auth/auth-client";

export function useCreateAccountMutation() {
	return useMutation({
		mutationFn: async (data: {
			email: string;
			password: string;
			username: string;
			inviteCode: string;
		}) =>
			authClient.signUp.email(
				{
					...data,
					name: data.username,
				},
				{
					onError: (error) => {
						throw new Error(error.error.message || "Account creation failed");
					},
				},
			),
	});
}
