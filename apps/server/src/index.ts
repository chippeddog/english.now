import "dotenv/config";
import { createContext } from "@english.now/api/context";
import { appRouter } from "@english.now/api/routers/index";
import { auth } from "@english.now/auth";
import { env } from "@english.now/env/server";
import { serve } from "@hono/node-server";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { WebSocketServer } from "ws";
import { registerAllWorkers } from "./jobs";
import contentRoutes from "./routes/content";
import conversationRoutes from "./routes/conversation";
import paddleRoutes from "./routes/paddle";
import profileRoutes from "./routes/profile";
import pronunciationRoutes from "./routes/pronunciation";
import uploadRoutes from "./routes/upload";
import { handleDeepgramProxy } from "./services/deepgram-stream";
import { getQueue } from "./utils/queue";

const app = new Hono();

/**
 * Middleware
 */
app.use(logger());
app.use(requestId());
app.use(
	"/*",
	cors({
		origin: env.CORS_ORIGIN,
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
			return createContext({ context });
		},
	}),
);

// REST API routes for profile
app.route("/api/profile", profileRoutes);

// REST API routes for content generation (SSE streaming)
app.route("/api/content", contentRoutes);

// REST API routes for conversation (streaming support)
app.route("/api/conversation", conversationRoutes);

// REST API routes for pronunciation assessment (Azure Speech)
app.route("/api/pronunciation", pronunciationRoutes);

// REST API routes for file uploads
app.route("/api/upload", uploadRoutes);

// Paddle webhook routes (no auth required — Paddle calls directly)
app.route("/api/paddle", paddleRoutes);

app.get("/", (c) => {
	return c.text("OK");
});

const boss = getQueue();

boss.start().then(async () => {
	console.log("[pg-boss] started");
	await registerAllWorkers(boss);
	console.log("[pg-boss] workers registered");
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

async function shutdown() {
	console.log("Shutting down...");
	await boss.stop({ graceful: true, timeout: 30_000 });
	server.close();
	process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
