import { env } from "@english.now/env/server";
import * as Sentry from "@sentry/node";

if (env.SENTRY_DSN) {
	Sentry.init({
		dsn: env.SENTRY_DSN,
		environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV,
		release: env.SENTRY_RELEASE,
		integrations: [Sentry.honoIntegration()],
	});
}
