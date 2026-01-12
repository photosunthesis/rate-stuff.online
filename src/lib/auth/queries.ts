import { queryOptions } from "@tanstack/react-query";
import { getCurrentUser } from "./functions";

export const authQueryOptions = () =>
	queryOptions({
		queryKey: ["user"],
		queryFn: ({ signal }) => getCurrentUser({ signal }),
	});

export type AuthQueryResult = Awaited<ReturnType<typeof getCurrentUser>>;
