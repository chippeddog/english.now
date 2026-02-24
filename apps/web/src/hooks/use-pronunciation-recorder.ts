import { env } from "@english.now/env/client";
import { useCallback, useEffect, useRef, useState } from "react";

type DeepgramResult = {
	type: string;
	channel?: {
		alternatives?: {
			transcript?: string;
			confidence?: number;
		}[];
	};
	is_final?: boolean;
	speech_final?: boolean;
};

export default function usePronunciationRecorder() {
	const [isRecording, setIsRecording] = useState(false);
	const [isConnected, setIsConnected] = useState(false);
	const [transcript, setTranscript] = useState("");
	const [interimTranscript, setInterimTranscript] = useState("");

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const streamRef = useRef<MediaStream | null>(null);
	const wsRef = useRef<WebSocket | null>(null);
	const finalTranscriptRef = useRef("");

	const stopMediaStream = useCallback(() => {
		if (streamRef.current) {
			for (const track of streamRef.current.getTracks()) {
				track.stop();
			}
			streamRef.current = null;
		}
	}, []);

	const closeWebSocket = useCallback(() => {
		if (wsRef.current) {
			if (wsRef.current.readyState === WebSocket.OPEN) {
				wsRef.current.close();
			}
			wsRef.current = null;
		}
		setIsConnected(false);
	}, []);

	const connectDeepgram = useCallback((): Promise<WebSocket> => {
		return new Promise((resolve, reject) => {
			const wsUrl = env.VITE_SERVER_URL.replace("https://", "wss://").replace(
				"http://",
				"ws://",
			);

			const ws = new WebSocket(`${wsUrl}/ws/deepgram`);
			wsRef.current = ws;

			ws.onopen = () => {
				setIsConnected(true);
				resolve(ws);
			};

			ws.onmessage = (event) => {
				try {
					const data: DeepgramResult = JSON.parse(event.data);

					if (data.type === "Results") {
						const alt = data.channel?.alternatives?.[0];
						const text = alt?.transcript ?? "";

						if (data.is_final && text) {
							finalTranscriptRef.current +=
								(finalTranscriptRef.current ? " " : "") + text;
							setTranscript(finalTranscriptRef.current);
							setInterimTranscript("");
						} else if (text) {
							setInterimTranscript(text);
						}
					}
				} catch {
					// ignore non-JSON messages
				}
			};

			ws.onerror = () => {
				setIsConnected(false);
				reject(new Error("WebSocket connection failed"));
			};

			ws.onclose = () => {
				setIsConnected(false);
			};
		});
	}, []);

	const startRecording = useCallback(async () => {
		finalTranscriptRef.current = "";
		setTranscript("");
		setInterimTranscript("");

		try {
			const [stream, ws] = await Promise.all([
				navigator.mediaDevices.getUserMedia({ audio: true }),
				connectDeepgram(),
			]);

			streamRef.current = stream;

			const mediaRecorder = new MediaRecorder(stream, {
				mimeType: "audio/webm;codecs=opus",
			});
			mediaRecorderRef.current = mediaRecorder;
			audioChunksRef.current = [];

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunksRef.current.push(event.data);

					if (ws.readyState === WebSocket.OPEN) {
						event.data.arrayBuffer().then((buffer) => {
							ws.send(buffer);
						});
					}
				}
			};

			mediaRecorder.start(250);
			setIsRecording(true);
		} catch (err) {
			console.error("Error starting recording:", err);
			stopMediaStream();
			closeWebSocket();
		}
	}, [connectDeepgram, stopMediaStream, closeWebSocket]);

	const stopRecording = useCallback(async (): Promise<Blob | null> => {
		if (!mediaRecorderRef.current || !isRecording) return null;

		return new Promise<Blob | null>((resolve) => {
			const recorder = mediaRecorderRef.current;
			if (!recorder) {
				resolve(null);
				return;
			}

			recorder.onstop = () => {
				stopMediaStream();
				closeWebSocket();
				const blob = new Blob(audioChunksRef.current, {
					type: "audio/webm",
				});
				setIsRecording(false);
				resolve(blob);
			};

			recorder.stop();
		});
	}, [isRecording, stopMediaStream, closeWebSocket]);

	useEffect(() => {
		return () => {
			if (
				mediaRecorderRef.current &&
				mediaRecorderRef.current.state !== "inactive"
			) {
				try {
					mediaRecorderRef.current.stop();
				} catch (_) {}
			}
			stopMediaStream();
			closeWebSocket();
		};
	}, [stopMediaStream, closeWebSocket]);

	const fullTranscript = interimTranscript
		? `${transcript} ${interimTranscript}`.trim()
		: transcript;

	return {
		isRecording,
		isConnected,
		transcript: fullTranscript,
		finalTranscript: transcript,
		interimTranscript,
		startRecording,
		stopRecording,
		resetTranscript: useCallback(() => {
			finalTranscriptRef.current = "";
			setTranscript("");
			setInterimTranscript("");
		}, []),
	};
}
