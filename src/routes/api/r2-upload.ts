import { createFileRoute } from "@tanstack/react-router";
import {
	imagesBucketUrl,
	verifyPresignedUpload,
	uploadFile,
} from "~/features/file-storage/service";
import { env } from "cloudflare:workers";
import { getAuth } from "~/lib/auth.server";

export const Route = createFileRoute("/api/r2-upload")({
	server: {
		handlers: {
			PUT: async ({ request }) => {
				// Authenticate the request using cookies/headers
				const session = await getAuth().api.getSession({
					headers: request.headers,
					query: { disableCookieCache: true },
					returnHeaders: false,
				});

				if (!session) {
					console.warn(
						"r2-upload: session not found; headers:",
						Array.from(request.headers.entries()),
					);

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
					const body = await request.arrayBuffer();

					try {
						await uploadFile(env.R2_BUCKET, key, body, { type: contentType });
					} catch (err) {
						const msg = err instanceof Error ? err.message : String(err);
						console.error("R2 put failed:", msg);
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
					console.error("r2-upload handler error:", msg);
					return new Response(JSON.stringify({ success: false, error: msg }), {
						status: 500,
						headers: { "Content-Type": "application/json" },
					});
				}
			},
		},
	},
});
