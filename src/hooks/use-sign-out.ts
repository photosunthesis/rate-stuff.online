import { useQueryClient } from "@tanstack/react-query";
import authClient from "~/auth/auth.client";
import * as Sentry from "@sentry/tanstackstart-react";

export function useSignOut() {
	const queryClient = useQueryClient();

	const handleSignOut = async () => {
		try {
			queryClient.clear();
			await authClient.signOut();

			window.location.href = "/";
		} catch (error) {
			Sentry.captureException(error);
		}
	};

	return {
		signOut: handleSignOut,
	};
}
