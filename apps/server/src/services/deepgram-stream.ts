import type { IncomingMessage } from "node:http";
import { auth } from "@english.now/auth";
import { env } from "@english.now/env/server";
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

async function authenticateFromRequest(req: IncomingMessage): Promise<boolean> {
	try {
		const headers = new Headers();
		for (const [key, value] of Object.entries(req.headers)) {
			if (value) headers.set(key, Array.isArray(value) ? value[0] : value);
		}

		const session = await auth.api.getSession({ headers });
		return !!session;
	} catch {
		return false;
	}
}

export async function handleDeepgramProxy(ws: WebSocket, req: IncomingMessage) {
	const authenticated = await authenticateFromRequest(req);
	if (!authenticated) {
		ws.close(4001, "Unauthorized");
		return;
	}

	const dgUrl = `${DEEPGRAM_WS_URL}?${DG_PARAMS.toString()}`;
	const dgSocket = new WS(dgUrl, {
		headers: {
			Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
		},
	});

	let dgReady = false;
	const pendingChunks: Buffer[] = [];

	dgSocket.on("open", () => {
		dgReady = true;
		console.log(
			`[deepgram-ws] connected, flushing ${pendingChunks.length} buffered chunks`,
		);
		for (const chunk of pendingChunks) {
			dgSocket.send(chunk);
		}
		pendingChunks.length = 0;
	});

	dgSocket.on("message", (data) => {
		if (ws.readyState === ws.OPEN) {
			ws.send(data.toString());
		}
	});

	dgSocket.on("error", (err) => {
		console.error("[deepgram-ws] error:", err.message);
		if (ws.readyState === ws.OPEN) {
			ws.send(JSON.stringify({ type: "Error", message: err.message }));
		}
	});

	dgSocket.on("close", (code, reason) => {
		console.log(`[deepgram-ws] closed: ${code} ${reason.toString()}`);
		if (ws.readyState === ws.OPEN) {
			ws.close(1000, "Deepgram connection closed");
		}
	});

	ws.on("message", (data: Buffer) => {
		if (dgReady && dgSocket.readyState === WS.OPEN) {
			dgSocket.send(data);
		} else if (!dgReady) {
			pendingChunks.push(Buffer.from(data));
		}
	});

	ws.on("close", () => {
		if (dgSocket.readyState === WS.OPEN) {
			dgSocket.send(JSON.stringify({ type: "CloseStream" }));
			dgSocket.close();
		}
	});

	ws.on("error", () => {
		if (dgSocket.readyState === WS.OPEN) {
			dgSocket.close();
		}
	});
}
