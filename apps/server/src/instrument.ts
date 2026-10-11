import { startLangfuseTelemetry } from "@english.now/api/ai/langfuse";
import { env } from "@english.now/env/server";
import * as Sentry from "@sentry/node";

startLangfuseTelemetry();

if (env.SENTRY_DSN) {
	Sentry.init({
		dsn: env.SENTRY_DSN,
		environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV,
		release: env.SENTRY_RELEASE,
		tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
		integrations: [Sentry.honoIntegration()],
		skipOpenTelemetrySetup: true,
	});
}
