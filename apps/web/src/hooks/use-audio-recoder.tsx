import { env } from "@english.now/env/client";
import { useEffect, useRef, useState } from "react";

const WEBM_AUDIO_MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm"];

const MP4_AUDIO_MIME_TYPES = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4"];
const MAX_RECORDING_DURATION_MS = 60_000;

function isAppleMobileDevice() {
	if (typeof navigator === "undefined") return false;

	return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function getSupportedAudioMimeType() {
	if (typeof MediaRecorder === "undefined") return undefined;

	if (typeof MediaRecorder.isTypeSupported !== "function") {
		return "audio/mp4";
	}

	const preferredMimeTypes = isAppleMobileDevice()
		? [...MP4_AUDIO_MIME_TYPES, ...WEBM_AUDIO_MIME_TYPES]
		: [...WEBM_AUDIO_MIME_TYPES, ...MP4_AUDIO_MIME_TYPES];

	return preferredMimeTypes.find((mimeType) =>
		MediaRecorder.isTypeSupported(mimeType),
	);
}

function normalizeAudioMimeType(mimeType?: string) {
	const normalized = mimeType?.split(";")[0]?.trim().toLowerCase();

	switch (normalized) {
		case "audio/mp4":
		case "audio/m4a":
		case "audio/x-m4a":
		case "video/mp4":
			return "audio/mp4";
		case "audio/webm":
		case "video/webm":
			return "audio/webm";
		default:
			return normalized || "audio/webm";
	}
}

export default function useAudioRecorder(
	sessionId: string,
	sendMessage: (
		content: string,
		inputType: "text" | "voice",
		audioUrl?: string,
	) => Promise<void>,
	selectedDevice?: string,
) {
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const streamRef = useRef<MediaStream | null>(null);
	const mimeTypeRef = useRef("audio/webm");
	const recordingStartedAtRef = useRef<number | null>(null);
	const durationIntervalRef = useRef<number | null>(null);
	const autoStopTimeoutRef = useRef<number | null>(null);
	const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
	const [recordingDurationMs, setRecordingDurationMs] = useState(0);
	const [recordingState, setRecordingState] = useState<
		"idle" | "recording" | "transcribing"
	>("idle");

	const stopMediaStream = () => {
		if (streamRef.current) {
			for (const track of streamRef.current.getTracks()) {
				track.stop();
			}
			streamRef.current = null;
		}
	};

	const syncRecordingDuration = () => {
		if (recordingStartedAtRef.current === null) return;

		setRecordingDurationMs(
			Math.min(
				Date.now() - recordingStartedAtRef.current,
				MAX_RECORDING_DURATION_MS,
			),
		);
	};

	const clearRecordingTimers = () => {
		if (durationIntervalRef.current !== null) {
			window.clearInterval(durationIntervalRef.current);
			durationIntervalRef.current = null;
		}

		if (autoStopTimeoutRef.current !== null) {
			window.clearTimeout(autoStopTimeoutRef.current);
			autoStopTimeoutRef.current = null;
		}
	};

	const startRecordingTimers = () => {
		recordingStartedAtRef.current = Date.now();
		setRecordingDurationMs(0);
		clearRecordingTimers();

		durationIntervalRef.current = window.setInterval(() => {
			syncRecordingDuration();
		}, 250);

		autoStopTimeoutRef.current = window.setTimeout(() => {
			setRecordingDurationMs(MAX_RECORDING_DURATION_MS);
			clearRecordingTimers();

			if (mediaRecorderRef.current?.state === "recording") {
				mediaRecorderRef.current.stop();
			}
		}, MAX_RECORDING_DURATION_MS);
	};

	const resetRecordingTiming = () => {
		clearRecordingTimers();
		recordingStartedAtRef.current = null;
		setRecordingDurationMs(0);
	};

	useEffect(() => {
		return () => {
			clearRecordingTimers();
		};
	}, []);

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: selectedDevice
					? {
							deviceId: { exact: selectedDevice },
						}
					: true,
			});
			streamRef.current = stream;
			setAudioStream(stream);

			const supportedMimeType = getSupportedAudioMimeType();
			const mediaRecorder = supportedMimeType
				? new MediaRecorder(stream, { mimeType: supportedMimeType })
				: new MediaRecorder(stream);
			mediaRecorderRef.current = mediaRecorder;
			audioChunksRef.current = [];
			mimeTypeRef.current = normalizeAudioMimeType(
				mediaRecorder.mimeType || supportedMimeType,
			);

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunksRef.current.push(event.data);
					if (event.data.type) {
						mimeTypeRef.current = normalizeAudioMimeType(event.data.type);
					}
				}
			};

			mediaRecorder.onstop = async () => {
				const blob = new Blob(audioChunksRef.current, {
					type: mimeTypeRef.current,
				});

				setAudioStream(null);
				stopMediaStream();

				setRecordingState("transcribing");
				await transcribeAndSend(blob);
			};

			mediaRecorder.start();
			startRecordingTimers();
			setRecordingState("recording");
		} catch (err) {
			resetRecordingTiming();
			stopMediaStream();
			setAudioStream(null);
			console.error("Error accessing microphone:", err);
			alert("Failed to access microphone. Please check your permissions.");
		}
	};

	const stopRecording = () => {
		if (mediaRecorderRef.current && recordingState === "recording") {
			syncRecordingDuration();
			clearRecordingTimers();
			recordingStartedAtRef.current = null;
			mediaRecorderRef.current.stop();
		}
	};

	const cancelRecording = () => {
		if (mediaRecorderRef.current && recordingState === "recording") {
			mediaRecorderRef.current.ondataavailable = null;
			mediaRecorderRef.current.onstop = null;
			mediaRecorderRef.current.stop();
		}
		audioChunksRef.current = [];
		mimeTypeRef.current = "audio/webm";
		resetRecordingTiming();
		setAudioStream(null);
		stopMediaStream();
		setRecordingState("idle");
	};

	const transcribeAndSend = async (blob: Blob) => {
		try {
			const formData = new FormData();
			formData.append("sessionId", sessionId);
			formData.append("mimeType", normalizeAudioMimeType(blob.type));
			formData.append("audio", blob, "recording");

			const response = await fetch(
				`${env.VITE_SERVER_URL}/api/conversation/transcribe`,
				{
					method: "POST",
					credentials: "include",
					body: formData,
				},
			);

			if (!response.ok) throw new Error("Transcription failed");

			const { transcript, audioUrl } = await response.json();

			if (transcript) {
				await sendMessage(transcript, "voice", audioUrl);
			} else {
				alert("Couldn't understand the audio. Please try again.");
			}
		} catch (error) {
			console.error("Transcription error:", error);
			alert("Failed to transcribe audio. Please try again.");
		} finally {
			resetRecordingTiming();
			setRecordingState("idle");
		}
	};

	return {
		recordingState,
		recordingDurationMs,
		maxRecordingDurationMs: MAX_RECORDING_DURATION_MS,
		audioStream,
		startRecording,
		stopRecording,
		cancelRecording,
	};
}
