export function extractValidationErrors(
	payload: unknown,
): Record<string, string> {
	if (!payload || typeof payload !== "object" || Array.isArray(payload))
		return {};
	const obj = payload as Record<string, unknown>;
	const candidate = obj.fieldErrors ?? obj.errors ?? obj.error ?? undefined;
	if (!candidate || typeof candidate !== "object" || Array.isArray(candidate))
		return {};
	const c = candidate as Record<string, unknown>;
	const isStringMap = Object.values(c).every((v) => typeof v === "string");
	return isStringMap ? (c as Record<string, string>) : {};
}

export function normalizeError(err: unknown): {
	errorMessage?: string;
	errors?: Record<string, string>;
} {
	if (!err) return {};
	if (err instanceof Error) {
		const msg = err.message ?? "";
		try {
			const parsed = JSON.parse(msg);
			return normalizeError(parsed);
		} catch {
			return { errorMessage: msg };
		}
	}
	if (typeof err === "string") {
		try {
			const parsed = JSON.parse(err);
			return normalizeError(parsed);
		} catch {
			return { errorMessage: err };
		}
	}
	if (typeof err === "object" && err !== null && !Array.isArray(err)) {
		const o = err as Record<string, unknown>;
		const message =
			typeof o.errorMessage === "string"
				? o.errorMessage
				: typeof o.error === "string"
					? o.error
					: typeof o.message === "string"
						? o.message
						: undefined;
		const errors = extractValidationErrors(o);
		return {
			errorMessage: message,
			errors: Object.keys(errors).length ? errors : undefined,
		};
	}
	return { errorMessage: String(err) };
}

export function getErrorMessage(
	err: string | Error | null | undefined,
): string {
	if (!err) return "";
	if (typeof err === "string") return err;
	try {
		const parsed = JSON.parse(err.message);
		if (Array.isArray(parsed)) return parsed[0]?.message || err.message;
		return parsed.message || err.message;
	} catch {
		return err.message;
	}
}
