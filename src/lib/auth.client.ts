import { createAuthClient } from "better-auth/client";
import { usernameClient } from "better-auth/client/plugins";

const authClient = createAuthClient({
	baseURL: process.env.BETTER_AUTH_URL,
	plugins: [usernameClient()],
});

export default authClient;
