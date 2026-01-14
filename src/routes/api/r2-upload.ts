import { createFileRoute } from "@tanstack/react-router";
import { imagesBucketUrl } from "~/lib/core/media-storage";
import { env } from "cloudflare:workers";
import { getAuth } from "~/lib/core/auth";

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

					const now = Math.floor(Date.now() / 1000);
					const expNum = Number(expires);
					if (Number.isNaN(expNum) || now > expNum) {
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

					const secret = env.SESSION_SECRET;
					const encoder = new TextEncoder();
					const keyMaterial = await crypto.subtle.importKey(
						"raw",
						encoder.encode(secret),
						{ name: "HMAC", hash: "SHA-256" },
						false,
						["sign"],
					);

					const data = encoder.encode(`${key}|${expires}`);
					const signatureBuffer = await crypto.subtle.sign(
						"HMAC",
						keyMaterial,
						data,
					);
					const expected = Array.from(new Uint8Array(signatureBuffer))
						.map((b) => b.toString(16).padStart(2, "0"))
						.join("");

					if (sig !== expected) {
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
						await env.R2_BUCKET.put(key, body, {
							httpMetadata: { contentType },
						});
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
