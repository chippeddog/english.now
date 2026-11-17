import {
	CALL_HINT_INSTRUCTION,
	CALL_WRAP_UP_INSTRUCTION,
} from "@english.now/api/services/call-tutors";
import { env } from "@english.now/env/client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	playHangupTone,
	playRingback,
	readAudioLevel,
} from "@/lib/call-sounds";
import {
	createTurnRecorder,
	type TurnRecorder,
} from "@/lib/call-turn-recorder";

export type CallStatus =
	| "idle"
	| "ringing"
	| "live"
	| "ending"
	| "ended"
	| "failed";

export type CallErrorCode =
	| "MIC_DENIED"
	| "CALL_ENDED"
	| "TIME_EXPIRED"
	| "UNAVAILABLE"
	| "CONNECTION_LOST";

export type CallCaption = {
	id: string;
	role: "user" | "assistant";
	text: string;
	final: boolean;
	startedAt: number;
};

type RealtimeServerEvent = {
	type: string;
	item_id?: string;
	transcript?: string;
	delta?: string;
	error?: { message?: string; code?: string };
};

type ConnectResponse = {
	clientSecret: string;
	maxSeconds: number;
	remainingSeconds: number;
	resumed: boolean;
};

type LevelMeter = {
	analyser: AnalyserNode;
	buffer: Uint8Array<ArrayBuffer>;
	source: MediaStreamAudioSourceNode;
};

const MIN_RING_MS = 2200;
const CHANNEL_OPEN_TIMEOUT_MS = 10_000;
const DISCONNECT_GRACE_MS = 5000;
const WRAP_UP_AT_SECONDS = 20;
const MAX_CAPTIONS = 6;
const SPEECH_PREROLL_MS = 300;
const IGNORED_ERROR_CODES = new Set([
	"conversation_already_has_active_response",
	"response_cancel_not_active",
]);

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForChannelOpen(channel: RTCDataChannel) {
	if (channel.readyState === "open") return Promise.resolve();

	return new Promise<void>((resolve, reject) => {
		const timeout = setTimeout(
			() => reject(new Error("Data channel did not open")),
			CHANNEL_OPEN_TIMEOUT_MS,
		);
		channel.addEventListener("open", () => {
			clearTimeout(timeout);
			resolve();
		});
		channel.addEventListener("error", () => {
			clearTimeout(timeout);
			reject(new Error("Data channel error"));
		});
	});
}

function createLevelMeter(ctx: AudioContext, stream: MediaStream): LevelMeter {
	const source = ctx.createMediaStreamSource(stream);
	const analyser = ctx.createAnalyser();
	analyser.fftSize = 512;
	source.connect(analyser);
	return { analyser, buffer: new Uint8Array(analyser.fftSize), source };
}

function mapConnectError(error?: string): CallErrorCode {
	if (error === "CALL_ENDED") return "CALL_ENDED";
	if (error === "CALL_TIME_EXPIRED") return "TIME_EXPIRED";
	return "UNAVAILABLE";
}

export function useRealtimeCall(sessionId: string) {
	const [status, setStatus] = useState<CallStatus>("idle");
	const [error, setError] = useState<CallErrorCode | null>(null);
	const [captions, setCaptions] = useState<CallCaption[]>([]);
	const [isMuted, setIsMuted] = useState(false);
	const [tutorSpeaking, setTutorSpeaking] = useState(false);
	const [learnerSpeaking, setLearnerSpeaking] = useState(false);
	const [isResponding, setIsResponding] = useState(false);
	const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
	const [maxSeconds, setMaxSeconds] = useState<number | null>(null);

	const statusRef = useRef<CallStatus>("idle");
	const attemptRef = useRef(0);
	const mountedRef = useRef(true);
	const ctxRef = useRef<AudioContext | null>(null);
	const pcRef = useRef<RTCPeerConnection | null>(null);
	const dcRef = useRef<RTCDataChannel | null>(null);
	const micStreamRef = useRef<MediaStream | null>(null);
	const audioElRef = useRef<HTMLAudioElement | null>(null);
	const tutorMeterRef = useRef<LevelMeter | null>(null);
	const learnerMeterRef = useRef<LevelMeter | null>(null);
	const recorderRef = useRef<TurnRecorder | null>(null);
	const stopRingRef = useRef<(() => void) | null>(null);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const deadlineRef = useRef(0);
	const maxSecondsRef = useRef(0);
	const lastRemainingRef = useRef<number | null>(null);
	const hasConnectedRef = useRef(false);
	const isMutedRef = useRef(false);
	const responseActiveRef = useRef(false);
	const pendingResponseRef = useRef(false);
	const learnerSpeakingRef = useRef(false);
	const wrapUpSentRef = useRef(false);
	const pendingSavesRef = useRef(new Set<Promise<void>>());
	const userTurnStartsRef = useRef(new Map<string, number>());
	const assistantTurnStartsRef = useRef(new Map<string, number>());

	const updateStatus = useCallback((next: CallStatus) => {
		statusRef.current = next;
		setStatus(next);
	}, []);

	const ensureAudioContext = useCallback(() => {
		let ctx = ctxRef.current;
		if (!ctx || ctx.state === "closed") {
			ctx = new AudioContext();
			ctxRef.current = ctx;
		}
		if (ctx.state === "suspended") {
			void ctx.resume();
		}
		return ctx;
	}, []);

	const sendEvent = useCallback((event: Record<string, unknown>) => {
		const channel = dcRef.current;
		if (channel?.readyState === "open") {
			channel.send(JSON.stringify(event));
		}
	}, []);

	const requestResponse = useCallback(() => {
		if (responseActiveRef.current) {
			pendingResponseRef.current = true;
			return;
		}
		responseActiveRef.current = true;
		sendEvent({ type: "response.create" });
	}, [sendEvent]);

	const sendInstruction = useCallback(
		(text: string) => {
			sendEvent({
				type: "conversation.item.create",
				item: {
					type: "message",
					role: "system",
					content: [{ type: "input_text", text }],
				},
			});
			// While the learner is talking, the automatic reply will pick up the note.
			if (!learnerSpeakingRef.current) {
				requestResponse();
			}
		},
		[requestResponse, sendEvent],
	);

	const upsertCaption = useCallback(
		(
			id: string,
			role: CallCaption["role"],
			update: (text: string) => string,
			final: boolean,
			startedAt: number,
		) => {
			setCaptions((prev) => {
				const index = prev.findIndex((caption) => caption.id === id);
				if (index === -1) {
					return [...prev, { id, role, text: update(""), final, startedAt }]
						.sort((a, b) => a.startedAt - b.startedAt)
						.slice(-MAX_CAPTIONS);
				}

				const next = [...prev];
				const current = next[index] as CallCaption;
				next[index] = {
					...current,
					text: update(current.text),
					final: final || current.final,
				};
				return next;
			});
		},
		[],
	);

	const saveTurn = useCallback(
		(turn: {
			role: CallCaption["role"];
			content: string;
			startedAt?: number;
			audio?: Blob | null;
		}) => {
			const content = turn.content.trim();
			if (!content) return;

			const form = new FormData();
			form.set("sessionId", sessionId);
			form.set("role", turn.role);
			form.set("content", content);
			if (turn.startedAt) {
				form.set("startedAt", String(Math.round(turn.startedAt)));
			}
			if (turn.audio) {
				form.set("audio", turn.audio, "turn.wav");
			}

			const request: Promise<void> = fetch(
				`${env.VITE_SERVER_URL}/api/call/turn`,
				{ method: "POST", body: form, credentials: "include" },
			)
				.then((response) => {
					if (!response.ok) {
						console.warn("[call] Failed to save turn", response.status);
					}
				})
				.catch((saveError) => {
					console.error("[call] Failed to save turn", saveError);
				})
				.finally(() => {
					pendingSavesRef.current.delete(request);
				});

			pendingSavesRef.current.add(request);
		},
		[sessionId],
	);

	const handleServerEvent = useCallback(
		(event: RealtimeServerEvent) => {
			const itemId = event.item_id;

			switch (event.type) {
				case "input_audio_buffer.speech_started": {
					learnerSpeakingRef.current = true;
					setLearnerSpeaking(true);
					if (itemId) {
						userTurnStartsRef.current.set(
							itemId,
							Date.now() - SPEECH_PREROLL_MS,
						);
						recorderRef.current?.markStart(itemId);
					}
					break;
				}
				case "input_audio_buffer.speech_stopped": {
					learnerSpeakingRef.current = false;
					setLearnerSpeaking(false);
					if (itemId) {
						recorderRef.current?.markStop(itemId);
					}
					break;
				}
				case "conversation.item.input_audio_transcription.delta": {
					if (!itemId || !event.delta) break;
					const delta = event.delta;
					upsertCaption(
						itemId,
						"user",
						(text) => text + delta,
						false,
						userTurnStartsRef.current.get(itemId) ?? Date.now(),
					);
					break;
				}
				case "conversation.item.input_audio_transcription.completed": {
					if (!itemId) break;
					const transcript = event.transcript?.trim() ?? "";
					const startedAt = userTurnStartsRef.current.get(itemId);
					if (!transcript) {
						setCaptions((prev) => prev.filter((c) => c.id !== itemId));
						break;
					}
					upsertCaption(
						itemId,
						"user",
						() => transcript,
						true,
						startedAt ?? Date.now(),
					);
					saveTurn({
						role: "user",
						content: transcript,
						startedAt,
						audio: recorderRef.current?.take(itemId),
					});
					break;
				}
				case "conversation.item.input_audio_transcription.failed": {
					if (itemId) {
						setCaptions((prev) => prev.filter((c) => c.id !== itemId));
					}
					break;
				}
				case "response.created": {
					responseActiveRef.current = true;
					setIsResponding(true);
					break;
				}
				case "response.done": {
					responseActiveRef.current = false;
					setIsResponding(false);
					if (pendingResponseRef.current) {
						pendingResponseRef.current = false;
						requestResponse();
					}
					break;
				}
				case "response.output_audio_transcript.delta": {
					if (!itemId || !event.delta) break;
					if (!assistantTurnStartsRef.current.has(itemId)) {
						assistantTurnStartsRef.current.set(itemId, Date.now());
					}
					const delta = event.delta;
					upsertCaption(
						itemId,
						"assistant",
						(text) => text + delta,
						false,
						assistantTurnStartsRef.current.get(itemId) ?? Date.now(),
					);
					break;
				}
				case "response.output_audio_transcript.done": {
					if (!itemId) break;
					const transcript = event.transcript?.trim() ?? "";
					const startedAt =
						assistantTurnStartsRef.current.get(itemId) ?? Date.now();
					if (!transcript) break;
					upsertCaption(itemId, "assistant", () => transcript, true, startedAt);
					saveTurn({ role: "assistant", content: transcript, startedAt });
					break;
				}
				case "output_audio_buffer.started": {
					setTutorSpeaking(true);
					break;
				}
				case "output_audio_buffer.stopped":
				case "output_audio_buffer.cleared": {
					setTutorSpeaking(false);
					break;
				}
				case "error": {
					if (!IGNORED_ERROR_CODES.has(event.error?.code ?? "")) {
						console.warn("[call] Realtime error", event.error);
					}
					break;
				}
				default:
					break;
			}
		},
		[requestResponse, saveTurn, upsertCaption],
	);

	const teardown = useCallback(() => {
		if (timerRef.current) clearInterval(timerRef.current);
		if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
		timerRef.current = null;
		disconnectTimerRef.current = null;

		stopRingRef.current?.();
		stopRingRef.current = null;

		dcRef.current?.close();
		dcRef.current = null;
		pcRef.current?.close();
		pcRef.current = null;

		for (const track of micStreamRef.current?.getTracks() ?? []) {
			track.stop();
		}
		micStreamRef.current = null;

		if (audioElRef.current) {
			audioElRef.current.srcObject = null;
		}
		tutorMeterRef.current?.source.disconnect();
		learnerMeterRef.current?.source.disconnect();
		tutorMeterRef.current = null;
		learnerMeterRef.current = null;
		recorderRef.current?.dispose();
		recorderRef.current = null;

		responseActiveRef.current = false;
		pendingResponseRef.current = false;
		learnerSpeakingRef.current = false;
		setTutorSpeaking(false);
		setLearnerSpeaking(false);
		setIsResponding(false);
	}, []);

	const fail = useCallback(
		(code: CallErrorCode) => {
			teardown();
			setError(code);
			updateStatus("failed");
		},
		[teardown, updateStatus],
	);

	const finishSession = useCallback(async () => {
		const durationSeconds =
			hasConnectedRef.current && lastRemainingRef.current !== null
				? Math.max(0, maxSecondsRef.current - lastRemainingRef.current)
				: undefined;

		await Promise.allSettled([...pendingSavesRef.current]);

		const response = await fetch(
			`${env.VITE_SERVER_URL}/api/conversation/finish`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ sessionId, durationSeconds }),
			},
		);

		if (!response.ok) {
			throw new Error("Failed to finish call");
		}
	}, [sessionId]);

	const hangUp = useCallback(async () => {
		if (statusRef.current === "ending" || statusRef.current === "ended") {
			return false;
		}

		const wasLive = statusRef.current === "live";
		attemptRef.current += 1;
		teardown();
		if (wasLive && ctxRef.current) {
			playHangupTone(ctxRef.current);
		}
		updateStatus("ending");

		try {
			await finishSession();
			updateStatus("ended");
			return true;
		} catch (finishError) {
			console.error("[call] Failed to finish call", finishError);
			setError("UNAVAILABLE");
			updateStatus("failed");
			return false;
		}
	}, [finishSession, teardown, updateStatus]);

	const tick = useCallback(() => {
		const remaining = Math.max(
			0,
			Math.ceil((deadlineRef.current - Date.now()) / 1000),
		);
		lastRemainingRef.current = remaining;
		setRemainingSeconds((prev) => (prev === remaining ? prev : remaining));

		if (remaining <= WRAP_UP_AT_SECONDS && !wrapUpSentRef.current) {
			wrapUpSentRef.current = true;
			sendInstruction(CALL_WRAP_UP_INSTRUCTION);
		}

		if (remaining <= 0) {
			void hangUp();
		}
	}, [hangUp, sendInstruction]);

	const openPeerConnection = useCallback(
		async (ctx: AudioContext, clientSecret: string, mic: MediaStream) => {
			const pc = new RTCPeerConnection();
			pcRef.current = pc;

			const audioEl = audioElRef.current ?? new Audio();
			audioEl.autoplay = true;
			audioElRef.current = audioEl;

			pc.ontrack = (event) => {
				const [stream] = event.streams;
				if (!stream) return;
				audioEl.srcObject = stream;
				void audioEl.play().catch(() => {});
				tutorMeterRef.current?.source.disconnect();
				tutorMeterRef.current = createLevelMeter(ctx, stream);
			};

			pc.onconnectionstatechange = () => {
				if (pcRef.current !== pc || statusRef.current !== "live") return;

				if (pc.connectionState === "failed") {
					fail("CONNECTION_LOST");
					return;
				}

				if (pc.connectionState === "disconnected") {
					disconnectTimerRef.current = setTimeout(() => {
						if (pcRef.current === pc && pc.connectionState !== "connected") {
							fail("CONNECTION_LOST");
						}
					}, DISCONNECT_GRACE_MS);
					return;
				}

				if (pc.connectionState === "connected" && disconnectTimerRef.current) {
					clearTimeout(disconnectTimerRef.current);
					disconnectTimerRef.current = null;
				}
			};

			for (const track of mic.getAudioTracks()) {
				track.enabled = !isMutedRef.current;
				pc.addTrack(track, mic);
			}
			learnerMeterRef.current = createLevelMeter(ctx, mic);
			void createTurnRecorder(ctx, mic).then((recorder) => {
				if (pcRef.current === pc) {
					recorderRef.current = recorder;
				} else {
					recorder?.dispose();
				}
			});

			const channel = pc.createDataChannel("oai-events");
			dcRef.current = channel;
			channel.addEventListener("message", (event) => {
				try {
					handleServerEvent(JSON.parse(event.data) as RealtimeServerEvent);
				} catch (parseError) {
					console.warn("[call] Could not parse realtime event", parseError);
				}
			});

			const offer = await pc.createOffer();
			await pc.setLocalDescription(offer);

			const sdpResponse = await fetch(
				"https://api.openai.com/v1/realtime/calls",
				{
					method: "POST",
					body: offer.sdp,
					headers: {
						Authorization: `Bearer ${clientSecret}`,
						"Content-Type": "application/sdp",
					},
				},
			);

			if (!sdpResponse.ok) {
				throw new Error(`Realtime call failed: ${sdpResponse.status}`);
			}

			await pc.setRemoteDescription({
				type: "answer",
				sdp: await sdpResponse.text(),
			});
			await waitForChannelOpen(channel);
		},
		[fail, handleServerEvent],
	);

	const start = useCallback(async () => {
		if (statusRef.current === "ringing" || statusRef.current === "live") {
			return;
		}

		const attempt = attemptRef.current + 1;
		attemptRef.current = attempt;
		const isCurrent = () =>
			attemptRef.current === attempt && statusRef.current === "ringing";

		setError(null);
		updateStatus("ringing");

		const ctx = ensureAudioContext();
		stopRingRef.current = playRingback(ctx);
		const ringStartedAt = Date.now();

		let mic: MediaStream;
		try {
			mic = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
				},
			});
		} catch {
			if (isCurrent()) fail("MIC_DENIED");
			return;
		}

		if (!isCurrent()) {
			for (const track of mic.getTracks()) track.stop();
			return;
		}
		micStreamRef.current = mic;

		let connection: ConnectResponse;
		try {
			const response = await fetch(`${env.VITE_SERVER_URL}/api/call/connect`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ sessionId }),
			});

			if (!response.ok) {
				const body = (await response.json().catch(() => null)) as {
					error?: string;
				} | null;
				if (isCurrent()) fail(mapConnectError(body?.error));
				return;
			}

			connection = (await response.json()) as ConnectResponse;
		} catch {
			if (isCurrent()) fail("UNAVAILABLE");
			return;
		}

		if (!isCurrent()) return;

		try {
			await openPeerConnection(ctx, connection.clientSecret, mic);
		} catch (connectError) {
			console.error("[call] Could not connect", connectError);
			if (isCurrent()) fail("UNAVAILABLE");
			return;
		}

		const ringRemaining = MIN_RING_MS - (Date.now() - ringStartedAt);
		if (ringRemaining > 0) {
			await sleep(ringRemaining);
		}
		if (!isCurrent()) return;

		stopRingRef.current?.();
		stopRingRef.current = null;

		hasConnectedRef.current = true;
		maxSecondsRef.current = connection.maxSeconds;
		setMaxSeconds(connection.maxSeconds);
		deadlineRef.current = Date.now() + connection.remainingSeconds * 1000;
		lastRemainingRef.current = connection.remainingSeconds;
		setRemainingSeconds(connection.remainingSeconds);
		wrapUpSentRef.current = false;

		updateStatus("live");
		requestResponse();
		timerRef.current = setInterval(tick, 250);
	}, [
		ensureAudioContext,
		fail,
		openPeerConnection,
		requestResponse,
		sessionId,
		tick,
		updateStatus,
	]);

	const toggleMute = useCallback(() => {
		const next = !isMutedRef.current;
		isMutedRef.current = next;
		for (const track of micStreamRef.current?.getAudioTracks() ?? []) {
			track.enabled = !next;
		}
		setIsMuted(next);
	}, []);

	const requestHint = useCallback(() => {
		if (statusRef.current !== "live" || responseActiveRef.current) return;
		sendInstruction(CALL_HINT_INSTRUCTION);
	}, [sendInstruction]);

	const getTutorLevel = useCallback(
		() =>
			readAudioLevel(
				tutorMeterRef.current?.analyser ?? null,
				tutorMeterRef.current?.buffer ?? null,
			),
		[],
	);

	const getLearnerLevel = useCallback(
		() =>
			isMutedRef.current
				? 0
				: readAudioLevel(
						learnerMeterRef.current?.analyser ?? null,
						learnerMeterRef.current?.buffer ?? null,
					),
		[],
	);

	useEffect(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (statusRef.current === "live" || statusRef.current === "ringing") {
				event.preventDefault();
			}
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, []);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
			// Deferred so React StrictMode's simulated remount doesn't drop a live call.
			setTimeout(() => {
				if (mountedRef.current) return;
				attemptRef.current += 1;
				teardown();
				void ctxRef.current?.close();
				ctxRef.current = null;
			}, 0);
		};
	}, [teardown]);

	return {
		status,
		error,
		captions,
		isMuted,
		tutorSpeaking,
		learnerSpeaking,
		canRequestHint: status === "live" && !isResponding && !tutorSpeaking,
		remainingSeconds,
		maxSeconds,
		start,
		hangUp,
		toggleMute,
		requestHint,
		getTutorLevel,
		getLearnerLevel,
	};
}
