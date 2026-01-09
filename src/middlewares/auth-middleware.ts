import { createMiddleware } from "@tanstack/react-start";
import { getSession } from "~/utils/auth-utils";

export const authMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		const userSession = await getSession();
		if (!userSession) {
			throw new Response("Unauthorized", { status: 401 });
		}
		return next({ context: { userSession } });
	},
);
