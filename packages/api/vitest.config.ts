import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["src/**/*.test.ts"],
		// Modules validate env on import; tests never connect to these services.
		env: {
			DATABASE_URL: "postgresql://test:test@localhost:5432/test",
			BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-characters",
			BETTER_AUTH_URL: "http://localhost:3000",
			CORS_ORIGIN: "http://localhost:3001",
			OPENAI_API_KEY: "test",
			NODE_ENV: "test",
		},
	},
});
