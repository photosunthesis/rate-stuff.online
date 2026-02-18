import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getCurrentUserFn, getUserByUsernameFn } from "./functions";
import type { PublicUser } from "./types";

export const userQueryOptions = (username: string) =>
	queryOptions({
		queryKey: ["user", username],
		queryFn: async () => {
			const res = (await getUserByUsernameFn({ data: { username } })) as {
				success: boolean;
				data?: PublicUser;
				errorMessage?: string;
			};

			if (!res.success) {
				const err = res.errorMessage ?? "Failed to load user";
				if (err.toLowerCase().includes("not found")) return null;
				throw new Error(err);
			}

			return res.data ?? null;
		},
		staleTime: 1000 * 60,
		gcTime: 1000 * 60 * 10,
	});

export const authQueryOptions = () =>
	queryOptions({
		queryKey: ["user"],
		queryFn: ({ signal }) => getCurrentUserFn({ signal }),
		staleTime: Number.POSITIVE_INFINITY, // Never refetch unless explicitly invalidated
	});

export type AuthQueryResult = Awaited<ReturnType<typeof getCurrentUserFn>>;

export function useAuth() {
	return useSuspenseQuery(authQueryOptions());
}
