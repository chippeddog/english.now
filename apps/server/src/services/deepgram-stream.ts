import type { IncomingMessage } from "node:http";
import { auth } from "@english.now/auth";
import { capabilities, env } from "@english.now/env/server";
import type { WebSocket } from "ws";
import { WebSocket as WS } from "ws";

const DEEPGRAM_WS_URL = "wss://api.deepgram.com/v1/listen";

const DG_PARAMS = new URLSearchParams({
	model: "nova-3",
	language: "en",
	smart_format: "true",
	interim_results: "true",
	utterance_end_ms: "1500",
	vad_events: "true",
	endpointing: "300",
});

const MAX_SESSION_MS = 10 * 60 * 1000;
const MAX_PENDING_BYTES = 2 * 1024 * 1024;

const LOCAL_DEV_ORIGIN =
	/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d+$/;

export function isAllowedWebSocketOrigin(origin: string | undefined) {
	// Native apps do not send an Origin header; they still need a valid session.
	if (!origin) return true;
	if (origin === env.CORS_ORIGIN || origin === env.APP_URL) return true;
	return env.NODE_ENV === "development" && LOCAL_DEV_ORIGIN.test(origin);
}

async function authenticateFromRequest(req: IncomingMessage): Promise<boolean> {
	try {
		const headers = new Headers();
		for (const [key, value] of Object.entries(req.headers)) {
			if (!value) continue;
			if (Array.isArray(value)) {
				const firstValue = value[0];
				if (firstValue) {
					headers.set(key, firstValue);
				}
				continue;
			}
			headers.set(key, value);
		}

		const session = await auth.api.getSession({ headers });
		return !!session;
	} catch {
		return false;
	}
}

export async function handleDeepgramProxy(ws: WebSocket, req: IncomingMessage) {
	if (!capabilities.deepgram) {
		ws.close(4003, "Live transcription is not configured");
		return;
	}

	if (!isAllowedWebSocketOrigin(req.headers.origin)) {
		ws.close(4003, "Origin not allowed");
		return;
	}

	// Attach before the async auth step so audio sent right after connecting is buffered.
	const pendingChunks: Buffer[] = [];
	let pendingBytes = 0;
	let dgSocket: WS | null = null;
	let dgReady = false;

	ws.on("message", (data: Buffer) => {
		if (dgReady && dgSocket?.readyState === WS.OPEN) {
			dgSocket.send(data);
			return;
		}

		pendingBytes += data.length;
		if (pendingBytes > MAX_PENDING_BYTES) {
			ws.close(1009, "Too much buffered audio");
			return;
		}
		pendingChunks.push(Buffer.from(data));
	});

	const sessionTimer = setTimeout(() => {
		ws.close(4008, "Session time limit reached");
	}, MAX_SESSION_MS);

	ws.on("close", () => {
		clearTimeout(sessionTimer);
		if (dgSocket?.readyState === WS.OPEN) {
			dgSocket.send(JSON.stringify({ type: "CloseStream" }));
			dgSocket.close();
		}
	});

	ws.on("error", () => {
		if (dgSocket?.readyState === WS.OPEN) {
			dgSocket.close();
		}
	});

	const authenticated = await authenticateFromRequest(req);
	if (!authenticated) {
		ws.close(4001, "Unauthorized");
		return;
	}

	if (ws.readyState !== ws.OPEN) {
		return;
	}

	const dgUrl = `${DEEPGRAM_WS_URL}?${DG_PARAMS.toString()}`;
	const upstream = new WS(dgUrl, {
		headers: {
			Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
		},
	});
	dgSocket = upstream;

	upstream.on("open", () => {
		dgReady = true;
		for (const chunk of pendingChunks) {
			upstream.send(chunk);
		}
		pendingChunks.length = 0;
		pendingBytes = 0;
	});

	upstream.on("message", (data) => {
		if (ws.readyState === ws.OPEN) {
			ws.send(data.toString());
		}
	});

	upstream.on("error", (err) => {
		console.error("[deepgram-ws] error:", err.message);
		if (ws.readyState === ws.OPEN) {
			ws.send(
				JSON.stringify({ type: "Error", message: "Transcription error" }),
			);
		}
	});

	upstream.on("close", (code, reason) => {
		console.log(`[deepgram-ws] closed: ${code} ${reason.toString()}`);
		if (ws.readyState === ws.OPEN) {
			ws.close(1000, "Deepgram connection closed");
		}
	});
}
