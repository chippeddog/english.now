import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	clientPrefix: "VITE_",
	client: {
		VITE_SERVER_URL: z.url(),
		// Public URL of this web app, e.g. https://english.now (used for canonical links and the sitemap).
		VITE_APP_URL: z.url().optional(),
		// Optional: billing UI is hidden when Paddle is not configured on the server.
		VITE_PADDLE_CLIENT_TOKEN: z.string().optional(),
		VITE_PADDLE_ENVIRONMENT: z
			.enum(["sandbox", "production"])
			.default("sandbox"),
		VITE_SENTRY_DSN: z.url().optional(),
	},
	runtimeEnv: {
		VITE_SERVER_URL: import.meta.env.VITE_SERVER_URL,
		VITE_APP_URL: import.meta.env.VITE_APP_URL,
		VITE_PADDLE_CLIENT_TOKEN: import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
		VITE_PADDLE_ENVIRONMENT: import.meta.env.VITE_PADDLE_ENVIRONMENT,
		VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
	},
	emptyStringAsUndefined: true,
});
