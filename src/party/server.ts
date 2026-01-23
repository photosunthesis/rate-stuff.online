import type * as Party from "partykit/server";

export default class Server implements Party.Server {
	constructor(public room: Party.Room) {}

	async onRequest(req: Party.Request) {
		if (req.method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "POST, GET, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type",
				},
			});
		}

		if (req.method === "POST") {
			const body = (await req.json()) as { message: string };
			this.room.broadcast(body.message);

			return new Response("Broadcasted", {
				status: 200,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
			});
		}

		if (req.method === "GET") {
			return new Response("PartyKit Server is Running!", { status: 200 });
		}

		return new Response("Not found", { status: 404 });
	}
}
