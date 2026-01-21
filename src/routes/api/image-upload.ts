import { createFileRoute } from "@tanstack/react-router";
import {
	imagesBucketUrl,
	verifyPresignedUpload,
	uploadFile,
	MAX_FILE_SIZE,
	ALLOWED_CONTENT_TYPES,
} from "~/features/file-storage/service";
import { env } from "cloudflare:workers";
import { getAuth } from "~/auth/auth.server";

export const Route = createFileRoute("/api/image-upload")({
	server: {
		handlers: {
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
			PUT: async ({ request }) => {
				const session = await getAuth().api.getSession({
					headers: request.headers,
					query: { disableCookieCache: true },
					returnHeaders: false,
				});

				if (!session) {
					return new Response(
						JSON.stringify({ success: false, error: "Unauthorized" }),
						{
							status: 401,
							headers: { "Content-Type": "application/json" },
						},
					);
				}

				try {
					const url = new URL(request.url);
					const key = url.searchParams.get("key");
					const expires = url.searchParams.get("expires");
					const sig = url.searchParams.get("sig");

					if (!key || !expires || !sig) {
						return new Response(
							JSON.stringify({
								success: false,
								error: "Missing required query parameters",
							}),
							{
								status: 400,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					const verification = await verifyPresignedUpload(key, expires, sig);
					if (!verification.ok) {
						if (verification.reason === "expired") {
							return new Response(
								JSON.stringify({
									success: false,
									error: "Signature expired or invalid",
								}),
								{
									status: 403,
									headers: { "Content-Type": "application/json" },
								},
							);
						}

						return new Response(
							JSON.stringify({ success: false, error: "Invalid signature" }),
							{
								status: 401,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					const contentType =
						request.headers.get("content-type") || "application/octet-stream";
					const baseType = contentType.split(";")[0].toLowerCase().trim();

					if (!ALLOWED_CONTENT_TYPES.includes(baseType)) {
						return new Response(
							JSON.stringify({
								success: false,
								error: `Unsupported content type: ${baseType}. Allowed types: ${ALLOWED_CONTENT_TYPES.join(", ")}`,
							}),
							{
								status: 415,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					const contentLength = request.headers.get("content-length");
					if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE) {
						return new Response(
							JSON.stringify({
								success: false,
								error: "File too large. Maximum size is 10MB",
							}),
							{
								status: 413,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					const body = await request.arrayBuffer();

					if (body.byteLength > MAX_FILE_SIZE) {
						return new Response(
							JSON.stringify({
								success: false,
								error: "File too large. Maximum size is 10MB",
							}),
							{
								status: 413,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					if (body.byteLength === 0) {
						return new Response(
							JSON.stringify({ success: false, error: "File is empty" }),
							{
								status: 400,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					try {
						// console.log("Attempting upload to R2, bucket available:", !!env.R2_BUCKET);
						await uploadFile(env.R2_BUCKET, key, body, { type: contentType });
					} catch (err) {
						console.error("R2 Upload Error:", err);
						if (err instanceof Error && err.stack) console.error(err.stack);

						const msg = err instanceof Error ? err.message : String(err);
						return new Response(
							JSON.stringify({ success: false, error: msg }),
							{
								status: 502,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					const res = { success: true, url: `${imagesBucketUrl}/${key}` };
					return new Response(JSON.stringify(res), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					});
				} catch (e: unknown) {
					const msg = e instanceof Error ? e.message : String(e);
					return new Response(JSON.stringify({ success: false, error: msg }), {
						status: 500,
						headers: { "Content-Type": "application/json" },
					});
				}
			},
		},
	},
});
