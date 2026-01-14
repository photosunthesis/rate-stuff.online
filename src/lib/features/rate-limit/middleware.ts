import { env } from "cloudflare:workers";
import { createMiddleware } from "@tanstack/react-start";
import { getRequest, setResponseStatus } from "@tanstack/react-start/server";
import authClient from "~/lib/core/auth-client";

export const RATE_LIMITER_BINDING = {
	GENERAL: "GENERAL",
	AUTH: "AUTH",
} as const;

export type RateLimiterBinding =
	(typeof RATE_LIMITER_BINDING)[keyof typeof RATE_LIMITER_BINDING];

export const createRateLimitMiddleware = (config: {
	binding: RateLimiterBinding;
	keyFn: (request: Request) => string | Promise<string>;
	errorMessage?: string;
}) =>
	createMiddleware({ type: "function" }).server(async ({ next }) => {
		if (import.meta.env.DEV) return next();

		const request = getRequest();
		const key = await config.keyFn(request);
		const { success } = await env[config.binding].limit({ key });

		if (!success) {
			console.warn("Rate limit exceeded", {
				binding: config.binding,
				key,
				timestamp: new Date().toISOString(),
				ip: request.headers.get("CF-Connecting-IP") || "unknown",
				userAgent: request.headers.get("User-Agent") || "unknown",
				path: new URL(request.url).pathname,
			});

			setResponseStatus(429);
			throw new Error("Too Many Requests");
		}

		return next();
	});

export const rateLimitKeys = {
	byIp: (request: Request) =>
		request.headers.get("CF-Connecting-IP") || "unknown",

	byIpAndEndpoint: (request: Request) => {
		const ip = request.headers.get("CF-Connecting-IP") || "unknown";
		const path = new URL(request.url).pathname;
		return `${ip}:${path}`;
	},

	bySession: async (request: Request) => {
		try {
			const session = await authClient.getSession({
				query: { disableCookieCache: true },
			});

			// The getSession response can have multiple shapes depending on how it's called.
			// Narrow into possible structures without using `any`.
			const maybeResponse = (session as unknown as { response?: unknown })
				.response as
				| {
						user?: { id?: string };
						session?: { id?: string };
						sessionId?: string;
				  }
				| undefined;

			if (maybeResponse?.user?.id) return `user:${maybeResponse.user.id}`;
			if (maybeResponse?.session?.id)
				return `session:${maybeResponse.session.id}`;
			if (maybeResponse?.sessionId) return `session:${maybeResponse.sessionId}`;

			const maybeTop = session as unknown as {
				user?: { id?: string };
				session?: { id?: string; userId?: string };
			};
			if (maybeTop.user?.id) return `user:${maybeTop.user.id}`;
			if (maybeTop.session?.id) return `session:${maybeTop.session.id}`;
			if (maybeTop.session?.userId) return `user:${maybeTop.session.userId}`;
		} catch {
			// If anything goes wrong, fall back to cookie parsing below
		}

		const cookies = request.headers.get("Cookie") || "";
		const sessionMatch = cookies.match(/session=([^;]+)/);
		return sessionMatch ? `session:${sessionMatch[1]}` : "anonymous";
	},

	byHeader: (headerName: string) => (request: Request) =>
		request.headers.get(headerName) || "unknown",
};
