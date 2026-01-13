import { queryOptions } from "@tanstack/react-query";
import { getCurrentUserFn, getUserByUsernameFn } from "./api";
import type { PublicUser } from "./types";

export const userQueryOptions = (username: string) =>
	queryOptions({
		queryKey: ["user", username],
		queryFn: async () => {
			const res = (await getUserByUsernameFn({ data: { username } })) as {
				success: boolean;
				data?: PublicUser;
				error?: string;
			};

			if (!res.success) {
				const err = res.error ?? "Failed to load user";
				if (err.toLowerCase().includes("not found")) return null;
				throw new Error(err);
			}

			return res.data ?? null;
		},
		staleTime: 0,
		gcTime: 1000 * 60 * 10,
	});

export const authQueryOptions = () =>
	queryOptions({
		queryKey: ["user"],
		queryFn: ({ signal }) => getCurrentUserFn({ signal }),
	});

export type AuthQueryResult = Awaited<ReturnType<typeof getCurrentUserFn>>;
