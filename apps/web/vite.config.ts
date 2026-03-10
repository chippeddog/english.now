import { cloudflare } from "@cloudflare/vite-plugin";
import contentCollections from "@content-collections/vite";
import { sentryTanstackStart } from "@sentry/tanstackstart-react/vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [
		contentCollections(),
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		tsconfigPaths(),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
		sentryTanstackStart({
			org: "chippeddog",
			project: "english-now",
			authToken: process.env.SENTRY_AUTH_TOKEN,
		}),
	],
});
