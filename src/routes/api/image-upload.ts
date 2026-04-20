import { createFileRoute } from "@tanstack/react-router";
import {
	verifyPresignedUpload,
	uploadFile,
	MAX_FILE_SIZE,
	ALLOWED_CONTENT_TYPES,
} from "~/infrastructure/file-storage/service";
import { env } from "cloudflare:workers";
import { authMiddleware } from "~/features/auth/middleware";
import { actionRateLimitMiddleware } from "~/infrastructure/rate-limit/middleware";

const jsonResponse = (status: number, body: Record<string, unknown>) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});

export const Route = createFileRoute("/api/image-upload")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				/**
				 * Uploads use an internal presigned URL flow to bypass server function
				 * overhead and gain direct control over the request body stream.
				 *
				 * Flow:
				 * 1. User requests a signature via a server function (getUploadUrlFn).
				 * 2. Client uses that signature to PUT the binary data directly to this route.
				 * 3. This handler verifies the HMAC signature, confirms the user's session,
				 *    enforces constraints (size/type), and streams the file to R2.
				 */
				PUT: {
					middleware: [authMiddleware, actionRateLimitMiddleware],
					handler: async ({ request, context }) => {
						try {
							const url = new URL(request.url);
							const key = url.searchParams.get("key");
							const expires = url.searchParams.get("expires");
							const sig = url.searchParams.get("sig");

							if (!key || !expires || !sig) {
								return jsonResponse(400, {
									success: false,
									error: "Missing required query parameters",
								});
							}

							const contentType =
								request.headers.get("content-type") ||
								"application/octet-stream";
							const baseType = contentType.split(";")[0].toLowerCase().trim();

							if (!ALLOWED_CONTENT_TYPES.includes(baseType)) {
								return jsonResponse(415, {
									success: false,
									error: `Unsupported content type: ${baseType}. Allowed types: ${ALLOWED_CONTENT_TYPES.join(", ")}`,
								});
							}

							const verification = await verifyPresignedUpload(
								key,
								expires,
								sig,
								context.user.id,
								baseType,
							);
							if (!verification.ok) {
								return jsonResponse(
									verification.reason === "expired" ? 403 : 401,
									{
										success: false,
										error:
											verification.reason === "expired"
												? "Signature expired"
												: "Invalid signature",
									},
								);
							}

							const contentLengthHeader = request.headers.get("content-length");
							const contentLength = contentLengthHeader
								? parseInt(contentLengthHeader, 10)
								: NaN;

							if (!Number.isFinite(contentLength) || contentLength <= 0) {
								return jsonResponse(411, {
									success: false,
									error: "Content-Length header is required",
								});
							}

							if (contentLength > MAX_FILE_SIZE) {
								return jsonResponse(413, {
									success: false,
									error: "File too large. Maximum size is 10MB",
								});
							}

							if (!request.body) {
								return jsonResponse(400, {
									success: false,
									error: "File is empty",
								});
							}

							let uploaded: { url: string; size: number };
							try {
								uploaded = await uploadFile(env.R2_BUCKET, key, request.body, {
									type: baseType,
								});
							} catch (err) {
								const msg = err instanceof Error ? err.message : String(err);
								return jsonResponse(502, { success: false, error: msg });
							}

							if (uploaded.size > MAX_FILE_SIZE) {
								try {
									await env.R2_BUCKET.delete(key);
								} catch {
									// best-effort cleanup; object will be garbage under user scope
								}
								return jsonResponse(413, {
									success: false,
									error: "File too large. Maximum size is 10MB",
								});
							}

							return jsonResponse(200, {
								success: true,
								url: uploaded.url,
							});
						} catch (e: unknown) {
							const msg = e instanceof Error ? e.message : String(e);
							return jsonResponse(500, { success: false, error: msg });
						}
					},
				},
			}),
	},
});
