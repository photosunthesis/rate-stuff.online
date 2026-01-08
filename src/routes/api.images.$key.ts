import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

export const Route = createFileRoute("/api/images/$key")({
	server: {
		handlers: {
			GET: async ({ request, params }) => {
				try {
					const object = await env.rate_stuff_online_r2.get(params.key, {
						onlyIf: request.headers,
						range: request.headers,
					});

					if (!object) {
						return new Response("Not found", { status: 404 });
					}

					const headers = new Headers();
					object.writeHttpMetadata(headers);
					headers.set("etag", object.httpEtag);
					headers.set("Cache-Control", "public, max-age=31536000, immutable"); // max age = 1 year
					headers.set("Access-Control-Allow-Origin", "*");

					if (!("body" in object)) {
						return new Response(null, {
							headers,
							status: 304,
						});
					}

					return new Response(object.body, {
						headers,
						status: object.range ? 206 : 200,
					});
				} catch (error) {
					console.error("Error fetching from R2:", error);
					return new Response("Internal server error", { status: 500 });
				}
			},
		},
	},
});
