import "dotenv/config";
import "./instrument";
import { shutdownLangfuseTelemetry } from "@english.now/api/ai/langfuse";
import { createContext } from "@english.now/api/context";
import { storage } from "@english.now/api/lib/storage";
import { appRouter } from "@english.now/api/routers/index";
import { auth } from "@english.now/auth";
import { capabilities, env } from "@english.now/env/server";
import { serve } from "@hono/node-server";
import { trpcServer } from "@hono/trpc-server";
import * as Sentry from "@sentry/node";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { WebSocketServer } from "ws";
import { ZodError } from "zod";
import { enqueueGenerateDailyPracticePlan, registerAllWorkers } from "./jobs";
import callRoutes from "./routes/call";
import contentRoutes from "./routes/content";
import conversationRoutes from "./routes/conversation";
import filesRoutes from "./routes/files";
import paddleRoutes from "./routes/paddle";
import profileRoutes from "./routes/profile";
import pronunciationRoutes from "./routes/pronunciation";
import uploadRoutes from "./routes/upload";
import { handleDeepgramProxy } from "./services/deepgram-stream";
import { getQueue } from "./utils/queue";

const app = new Hono();
let isShuttingDown = false;

const LOCAL_DEV_ORIGIN =
	/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d+$/;

async function flushSentry() {
	await Sentry.flush(2_000).catch((error) => {
		console.error("[sentry] flush failed", error);
	});
}

async function flushTelemetry() {
	await Promise.all([
		flushSentry(),
		shutdownLangfuseTelemetry().catch((error) => {
			console.error("[langfuse] shutdown failed", error);
		}),
	]);
}

/**
 * Middleware
 */
app.use(logger());
app.use(requestId());
app.use(
	"/*",
	cors({
		origin: (origin) => {
			if (origin === env.CORS_ORIGIN) {
				return origin;
			}
			// Expo web and LAN devices run on dynamic local origins during development.
			if (env.NODE_ENV === "development" && LOCAL_DEV_ORIGIN.test(origin)) {
				return origin;
			}
			return null;
		},
		allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

/**
 * Auth routes
 */
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

/**
 * TRPC routes
 */
app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => {
			return createContext({
				context,
				enqueueDailyPracticePlan: (data) =>
					enqueueGenerateDailyPracticePlan(boss, data),
			});
		},
		onError: ({ error, path }) => {
			if (error.code === "INTERNAL_SERVER_ERROR") {
				Sentry.captureException(error.cause ?? error, {
					tags: { trpcPath: path ?? "unknown" },
				});
				console.error(`[trpc] ${path ?? "unknown"} failed:`, error);
			}
		},
	}),
);

// REST API routes for profile
app.route("/api/profile", profileRoutes);

// REST API routes for content generation (SSE streaming)
app.route("/api/content", contentRoutes);

// REST API routes for conversation (streaming support)
app.route("/api/conversation", conversationRoutes);

// REST API routes for live tutor phone calls (OpenAI Realtime)
app.route("/api/call", callRoutes);

// REST API routes for pronunciation assessment (Azure Speech)
app.route("/api/pronunciation", pronunciationRoutes);

// REST API routes for file uploads
app.route("/api/upload", uploadRoutes);

// Paddle webhook routes (no auth required — Paddle calls directly)
app.route("/api/paddle", paddleRoutes);

// Local file storage, used when R2 is not configured
if (storage.kind === "local") {
	app.route("/files", filesRoutes);
}

app.get("/", (c) => {
	return c.text("OK");
});

app.onError((error, c) => {
	if (error instanceof HTTPException) {
		return error.getResponse();
	}
	if (error instanceof ZodError) {
		return c.json({ error: "Invalid request" }, 400);
	}

	Sentry.captureException(error);
	console.error(`[http] ${c.req.method} ${c.req.path} failed:`, error);
	return c.json({ error: "Internal server error" }, 500);
});

console.log(
	`[capabilities] ${Object.entries(capabilities)
		.map(([name, enabled]) => `${name}=${enabled ? "on" : "off"}`)
		.join(" ")}`,
);

const boss = getQueue();

void boss
	.start()
	.then(async () => {
		console.log("[pg-boss] started");
		await registerAllWorkers(boss);
		console.log("[pg-boss] workers registered");
	})
	.catch(async (error) => {
		Sentry.captureException(error);
		console.error("[pg-boss] failed to start", error);
		await flushTelemetry();
		process.exit(1);
	});

const server = serve(
	{
		fetch: app.fetch,
		port: env.PORT,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
	if (request.url === "/ws/deepgram") {
		wss.handleUpgrade(request, socket, head, (ws) => {
			handleDeepgramProxy(ws, request);
		});
	} else {
		socket.destroy();
	}
});

async function shutdown(signal: NodeJS.Signals) {
	if (isShuttingDown) {
		return;
	}

	isShuttingDown = true;
	console.log(`Received ${signal}, shutting down...`);

	try {
		await boss.stop({ graceful: true, timeout: 30_000 });
	} catch (error) {
		Sentry.captureException(error);
		console.error("[pg-boss] failed to stop", error);
	}

	server.close();
	await flushTelemetry();
	process.exit(0);
}

process.on("SIGINT", () => {
	void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
	void shutdown("SIGTERM");
});
