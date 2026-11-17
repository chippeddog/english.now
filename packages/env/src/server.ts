import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		// ─── Required ────────────────────────────────────────────────────────
		DATABASE_URL: z.url(),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.url(),
		CORS_ORIGIN: z.url(),
		OPENAI_API_KEY: z.string().min(1),

		// ─── Deployment ──────────────────────────────────────────────────────
		// Public URL of the web app (used for links and trusted origins).
		APP_URL: z.url().optional(),
		// Parent domain for cross-subdomain cookies in production, e.g. ".english.now".
		COOKIE_DOMAIN: z.string().optional(),
		PORT: z.coerce.number().default(3000),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),

		// ─── Optional integrations ───────────────────────────────────────────
		// Every block below is optional. Features that depend on a missing
		// integration are disabled; see `capabilities`.

		// Google OAuth
		GOOGLE_CLIENT_ID: z.string().optional(),
		GOOGLE_CLIENT_SECRET: z.string().optional(),

		// Apple OAuth
		APPLE_CLIENT_ID: z.string().optional(),
		APPLE_CLIENT_SECRET: z.string().optional(),
		APPLE_APP_BUNDLE_IDENTIFIER: z.string().optional(),

		// Deepgram (live speech-to-text, text-to-speech). Falls back to OpenAI.
		DEEPGRAM_API_KEY: z.string().optional(),

		// Azure Speech (pronunciation assessment)
		AZURE_SPEECH_KEY: z.string().optional(),
		AZURE_SPEECH_REGION: z.string().optional(),

		// LangFuse (AI observability)
		LANGFUSE_SECRET_KEY: z.string().optional(),
		LANGFUSE_PUBLIC_KEY: z.string().optional(),
		LANGFUSE_BASE_URL: z.url().optional(),

		// Cloudflare R2 storage. Falls back to the local disk.
		R2_ENDPOINT: z.url().optional(),
		R2_ACCESS_KEY_ID: z.string().optional(),
		R2_SECRET_ACCESS_KEY: z.string().optional(),
		R2_PUBLIC_URL: z.url().optional(),
		LOCAL_STORAGE_DIR: z.string().default("storage"),

		// Email (AutoSend). Without it, emails are logged to the console.
		AUTOSEND_API_KEY: z.string().optional(),
		AUTOSEND_RESET_PASSWORD_TEMPLATE_ID: z.string().optional(),
		AUTOSEND_VERIFY_EMAIL_TEMPLATE_ID: z.string().optional(),
		EMAIL_FROM: z.email().default("noreply@english.now"),
		CONTACT_INBOX_EMAIL: z.email().default("hello@english.now"),

		// Paddle payments. Without it, every user gets unlimited access.
		PADDLE_API_KEY: z.string().optional(),
		PADDLE_WEBHOOK_SECRET: z.string().optional(),
		PADDLE_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),

		// Monitoring
		SENTRY_DSN: z.url().optional(),
		SENTRY_ENVIRONMENT: z.string().optional(),
		SENTRY_RELEASE: z.string().optional(),
		SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});

export const capabilities = {
	googleAuth: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
	appleAuth: !!(env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET),
	email: !!(
		env.AUTOSEND_API_KEY &&
		env.AUTOSEND_RESET_PASSWORD_TEMPLATE_ID &&
		env.AUTOSEND_VERIFY_EMAIL_TEMPLATE_ID
	),
	billing: !!(env.PADDLE_API_KEY && env.PADDLE_WEBHOOK_SECRET),
	pronunciationAssessment: !!(env.AZURE_SPEECH_KEY && env.AZURE_SPEECH_REGION),
	deepgram: !!env.DEEPGRAM_API_KEY,
	objectStorage: !!(
		env.R2_ENDPOINT &&
		env.R2_ACCESS_KEY_ID &&
		env.R2_SECRET_ACCESS_KEY &&
		env.R2_PUBLIC_URL
	),
} as const;

export type Capabilities = typeof capabilities;
