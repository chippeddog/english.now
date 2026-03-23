import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		// Database
		DATABASE_URL: z.url(),

		// Auth
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.url(),
		CORS_ORIGIN: z.url(),

		// Google OAuth
		GOOGLE_CLIENT_ID: z.string().min(1),
		GOOGLE_CLIENT_SECRET: z.string().min(1),

		// Apple OAuth (optional)
		APPLE_CLIENT_ID: z.string().optional(),
		APPLE_CLIENT_SECRET: z.string().optional(),

		// AI Services
		OPENAI_API_KEY: z.string().min(1),
		DEEPGRAM_API_KEY: z.string().min(1),
		AZURE_SPEECH_KEY: z.string().min(1),
		AZURE_SPEECH_REGION: z.string().min(1),

		// Cloudflare R2 Storage
		R2_ENDPOINT: z.url(),
		R2_ACCESS_KEY_ID: z.string().min(1),
		R2_SECRET_ACCESS_KEY: z.string().min(1),
		R2_BUCKET_NAME: z.string().min(1),
		R2_PUBLIC_URL: z.url(),

		// Email (AutoSend)
		AUTOSEND_API_KEY: z.string().min(1),
		AUTOSEND_RESET_PASSWORD_TEMPLATE_ID: z.string().min(1),
		AUTOSEND_VERIFY_EMAIL_TEMPLATE_ID: z.string().min(1),
		EMAIL_FROM: z.email().default("noreply@english.now"),
		CONTACT_INBOX_EMAIL: z.email().default("hello@english.now"),

		// Paddle Payments
		PADDLE_API_KEY: z.string().min(1),
		PADDLE_WEBHOOK_SECRET: z.string().min(1),
		PADDLE_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),

		// Server
		PORT: z.coerce.number().default(3000),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),

		// Monitoring
		SENTRY_DSN: z.url().optional(),
		SENTRY_ENVIRONMENT: z.string().optional(),
		SENTRY_RELEASE: z.string().optional(),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
