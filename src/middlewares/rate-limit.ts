import { env } from "cloudflare:workers";
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

type RateLimiterBinding = "GENERAL_RATE_LIMITER" | "AUTH_RATE_LIMITER";

type RateLimitConfig = {
	binding: RateLimiterBinding;
	keyFn: (request: Request) => string;
	errorMessage?: string;
	skipInProduction?: boolean;
};

export class RateLimitError extends Error {
	constructor(
		message: string,
		public readonly statusCode = 429,
		public readonly retryAfter?: number,
	) {
		super(message);
		this.name = "RateLimitError";
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, RateLimitError);
		}
	}

	toJSON() {
		return {
			error: this.message,
			statusCode: this.statusCode,
			retryAfter: this.retryAfter,
		};
	}
}

export const createRateLimitMiddleware = (config: RateLimitConfig) =>
	createMiddleware({ type: "function" }).server(async ({ next }) => {
		if (import.meta.env.DEV || config.skipInProduction) {
			return next();
		}

		try {
			const request = getRequest();
			const key = config.keyFn(request);

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

				throw new RateLimitError(
					config.errorMessage ||
						"Too many requests. Please try again in a minute.",
					429,
					60,
				);
			}

			return next();
		} catch (error) {
			if (error instanceof RateLimitError) {
				throw error;
			}

			console.error("Rate limiter error (failing open):", {
				binding: config.binding,
				error: error instanceof Error ? error.message : String(error),
			});

			return next();
		}
	});

export const rateLimitKeys = {
	byIp: (request: Request) =>
		request.headers.get("CF-Connecting-IP") || "unknown",

	byIpAndEndpoint: (request: Request) => {
		const ip = request.headers.get("CF-Connecting-IP") || "unknown";
		const path = new URL(request.url).pathname;
		return `${ip}:${path}`;
	},

	bySession: (request: Request) => {
		const cookies = request.headers.get("Cookie") || "";
		const sessionMatch = cookies.match(/session=([^;]+)/);
		return sessionMatch ? `session:${sessionMatch[1]}` : "anonymous";
	},

	byHeader: (headerName: string) => (request: Request) =>
		request.headers.get(headerName) || "unknown",
};
