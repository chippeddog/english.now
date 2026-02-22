import { useCallback, useEffect, useRef, useState } from "react";

export default function useVoiceRecorder() {
	const [isRecording, setIsRecording] = useState(false);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const streamRef = useRef<MediaStream | null>(null);

	const stopMediaStream = useCallback(() => {
		if (streamRef.current) {
			for (const track of streamRef.current.getTracks()) {
				track.stop();
			}
			streamRef.current = null;
		}
	}, []);

	const startRecording = useCallback(async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
			});
			streamRef.current = stream;

			const mediaRecorder = new MediaRecorder(stream, {
				mimeType: "audio/webm;codecs=opus",
			});
			mediaRecorderRef.current = mediaRecorder;
			audioChunksRef.current = [];

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunksRef.current.push(event.data);
				}
			};

			mediaRecorder.start();
			setIsRecording(true);
		} catch (err) {
			console.error("Error accessing microphone:", err);
		}
	}, []);

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
				const blob = new Blob(audioChunksRef.current, {
					type: "audio/webm",
				});
				setIsRecording(false);
				resolve(blob);
			};

			recorder.stop();
		});
	}, [isRecording, stopMediaStream]);

	useEffect(() => {
		return () => {
			if (
				mediaRecorderRef.current &&
				mediaRecorderRef.current.state !== "inactive"
			) {
				try {
					mediaRecorderRef.current.stop();
				} catch (_) {
					// ignore
				}
			}
			if (streamRef.current) {
				for (const track of streamRef.current.getTracks()) {
					track.stop();
				}
			}
		};
	}, []);

	return {
		isRecording,
		startRecording,
		stopRecording,
	};
}
