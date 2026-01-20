import * as Sentry from "@sentry/tanstackstart-react";

export class TimeoutError extends Error {
	constructor(
		message = "Request timed out",
		public context?: string,
	) {
		super(message);
		this.name = "TimeoutError";
	}
}

interface TimeoutOptions {
	timeoutMs?: number;
	errorMessage?: string;
	context?: string;
}

const DEFAULT_TIMEOUT_MS = 16000; // 16 seconds

export async function withTimeout<T>(
	promise: Promise<T>,
	options: TimeoutOptions = {},
): Promise<T> {
	// Capture stack at the call site for better debugging in Sentry
	const callStack = new Error().stack;
	const {
		timeoutMs = DEFAULT_TIMEOUT_MS,
		errorMessage = "Request timed out",
		context = "general",
	} = options;

	let timerId: ReturnType<typeof setTimeout> | undefined;

	const timeoutPromise = new Promise<never>((_, reject) => {
		timerId = setTimeout(() => {
			const error = new TimeoutError(`${errorMessage} [${context}]`, context);
			if (callStack) error.stack = callStack;

			Sentry.captureException(error, {
				tags: {
					type: "client_timeout",
					timeout_context: context,
				},
				extra: {
					timeoutMs,
					url: typeof window !== "undefined" ? window.location.href : "unknown",
				},
			});

			reject(error);
		}, timeoutMs);
	});

	try {
		return await Promise.race([promise, timeoutPromise]);
	} finally {
		if (timerId) clearTimeout(timerId);
	}
}
