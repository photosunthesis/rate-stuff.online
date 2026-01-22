import type * as Party from "partykit/server";

export default class Server implements Party.Server {
	constructor(public room: Party.Room) {}

	async onRequest(req: Party.Request) {
		if (req.method === "POST") {
			const body = (await req.json()) as { message: string };
			this.room.broadcast(body.message);
			return new Response("Broadcasted", { status: 200 });
		}
		return new Response("Not found", { status: 404 });
	}
}
