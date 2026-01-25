import { createFileRoute } from "@tanstack/react-router";
import { getImageKit } from "~/infrastructure/file-storage/service";
import { optionalAuthMiddleware } from "~/domains/users/middleware";

const PRESETS = {
	avatar: {
		transformation: [
			{ height: "240", width: "240", quality: "60", format: "webp" },
		],
	},
	card: {
		transformation: [{ width: "640", quality: "80", format: "webp" }],
	},
	lightbox: {
		transformation: [{ quality: "90", format: "webp" }],
	},
	raw: {
		transformation: [],
	},
};

export const Route = createFileRoute("/api/image")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
					middleware: [optionalAuthMiddleware],
					handler: async ({ request }) => {
						const url = new URL(request.url);
						const path = url.searchParams.get("path");
						const variant = url.searchParams.get(
							"variant",
						) as keyof typeof PRESETS;

						if (!path) return new Response("Missing path", { status: 400 });

						const preset = PRESETS[variant] || PRESETS.card;
						const imagekit = getImageKit();
						const signedUrl = imagekit.url({
							path,
							transformation: preset.transformation,
							signed: true,
							expireSeconds: 300,
						});

						return new Response(null, {
							status: 302,
							headers: {
								Location: signedUrl,
								"Cache-Control": "public, max-age=300",
							},
						});
					},
				},
			}),
	},
});
