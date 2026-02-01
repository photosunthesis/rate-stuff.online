import { env } from "cloudflare:workers";
import { createMiddleware } from "@tanstack/react-start";
import { getRequest, setResponseStatus } from "@tanstack/react-start/server";
import { getAuth } from "~/domains/users/auth/server";

export const RATE_LIMITER_BINDING = {
	GENERAL: "GENERAL",
	PAGINATION: "PAGINATION",
} as const;

export type RateLimiterBinding =
	(typeof RATE_LIMITER_BINDING)[keyof typeof RATE_LIMITER_BINDING];

export const createRateLimitMiddleware = (config: {
	binding: RateLimiterBinding;
	keyFn: (request: Request) => string | Promise<string>;
	errorMessage?: string;
}) =>
	createMiddleware().server(async ({ next }) => {
		if (import.meta.env.DEV) return next();

		const request = getRequest();
		const key = await config.keyFn(request);
		const { success } = await env[config.binding].limit({ key });

		if (!success) {
			setResponseStatus(429);
			throw new Error(config.errorMessage || "Too Many Requests");
		}

		return next();
	});

export const rateLimitKeys = {
	byIpAndEndpoint: (request: Request) => {
		const ip = request.headers.get("CF-Connecting-IP") || "unknown";
		const path = new URL(request.url).pathname;
		return `${ip}:${path}`;
	},

	bySession: async (request: Request) => {
		try {
			const auth = await getAuth().api.getSession({
				headers: request.headers,
			});

			if (auth?.user?.id) return `user:${auth.user.id}`;
			if (auth?.session?.id) return `session:${auth.session.id}`;
		} catch {
			// ignore
		}

		return "anonymous";
	},

	bySessionThenIpAndEndpoint: async (request: Request) => {
		const sessionKey = await rateLimitKeys.bySession(request);

		if (sessionKey && !sessionKey.startsWith("anonymous")) return sessionKey;

		return rateLimitKeys.byIpAndEndpoint(request);
	},
};

export const generalRateLimitMiddleware = createRateLimitMiddleware({
	binding: RATE_LIMITER_BINDING.GENERAL,
	keyFn: rateLimitKeys.bySessionThenIpAndEndpoint,
	errorMessage: "Too many requests. Please try again later.",
});

export const actionRateLimitMiddleware = createRateLimitMiddleware({
	binding: RATE_LIMITER_BINDING.GENERAL,
	keyFn: rateLimitKeys.bySessionThenIpAndEndpoint,
	errorMessage: "Too many requests. Please try again after a short while.",
});

export const paginationRateLimitMiddleware = createRateLimitMiddleware({
	binding: RATE_LIMITER_BINDING.PAGINATION,
	keyFn: rateLimitKeys.bySessionThenIpAndEndpoint,
	errorMessage: "Too many requests. Please try again later.",
});
