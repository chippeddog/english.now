import type { auth } from "@english.now/auth";
// import { env } from "@english.now/env/client";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL:
		import.meta.env.MODE === "development"
			? "http://localhost:3000"
			: import.meta.env.VITE_SERVER_URL,
	plugins: [inferAdditionalFields<typeof auth>()],
});
