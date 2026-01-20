import { createMiddleware } from "@tanstack/react-start";
import {
	getRequest,
	setResponseHeader,
	setResponseStatus,
} from "@tanstack/react-start/server";
import { getAuth } from "~/auth/auth.server";

export const authMiddleware = createMiddleware().server(async ({ next }) => {
	const session = await getAuth().api.getSession({
		headers: getRequest().headers,
		returnHeaders: true,
	});

	// Forward any Set-Cookie headers to the client, e.g. for session/cache refresh
	const cookies = session.headers?.getSetCookie();

	if (cookies?.length) {
		setResponseHeader("Set-Cookie", cookies);
	}

	if (!session?.response?.user) {
		setResponseStatus(401);
		throw new Error("Unauthorized");
	}

	return next({ context: { user: session.response.user } });
});

export const optionalAuthMiddleware = createMiddleware().server(
	async ({ next }) => {
		const session = await getAuth().api.getSession({
			headers: getRequest().headers,
			returnHeaders: true,
		});

		const cookies = session?.headers?.getSetCookie();

		if (cookies?.length) {
			setResponseHeader("Set-Cookie", cookies);
		}

		return next({ context: { user: session?.response?.user ?? null } });
	},
);
