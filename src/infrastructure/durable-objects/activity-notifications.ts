import { DurableObject } from "cloudflare:workers";

interface BroadcastBody {
	message: string;
}

export class ActivityNotifications extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.ctx.setWebSocketAutoResponse(
			new WebSocketRequestResponsePair("ping", "pong"),
		);
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		if (request.headers.get("Upgrade") === "websocket") {
			const pair = new WebSocketPair();
			const [client, server] = Object.values(pair);
			this.ctx.acceptWebSocket(server);
			return new Response(null, { status: 101, webSocket: client });
		}

		if (request.method === "POST" && url.pathname === "/broadcast") {
			const body = (await request.json()) as BroadcastBody;
			for (const ws of this.ctx.getWebSockets()) {
				ws.send(body.message);
			}
			return new Response("OK", { status: 200 });
		}

		return new Response("Not Found", { status: 404 });
	}

	async webSocketClose(
		ws: WebSocket,
		code: number,
		reason: string,
		_wasClean: boolean,
	): Promise<void> {
		ws.close(code, reason);
	}

	async webSocketError(ws: WebSocket, _error: unknown): Promise<void> {
		ws.close(1011, "WebSocket error");
	}
}
