import handler from "@tanstack/react-start/server-entry";
import { env } from "cloudflare:workers";

export { ActivityNotifications } from "./durable-objects/activity-notifications";

export default {
	fetch(request: Request) {
		const url = new URL(request.url);
		const wsMatch = url.pathname.match(/^\/ws\/activity\/(.+)$/);

		if (wsMatch && request.headers.get("Upgrade") === "websocket") {
			const userId = wsMatch[1];
			const id = env.ACTIVITY_NOTIFICATIONS.idFromName(`user-${userId}`);
			const stub = env.ACTIVITY_NOTIFICATIONS.get(id);
			return stub.fetch(request);
		}

		return handler.fetch(request);
	},
};
