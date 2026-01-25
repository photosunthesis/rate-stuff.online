import { useQueryClient } from "@tanstack/react-query";
import authClient from "~/domains/users/auth/client";
import * as Sentry from "@sentry/tanstackstart-react";

export function useSignOut() {
	const queryClient = useQueryClient();

	const handleSignOut = async () => {
		try {
			queryClient.clear();
			localStorage.removeItem("create-rating-stuff");
			localStorage.removeItem("create-rating-tags");
			localStorage.removeItem("create-rating-score");
			localStorage.removeItem("create-rating-content");
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
