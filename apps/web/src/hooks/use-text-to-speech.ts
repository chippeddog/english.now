import { env } from "@english.now/env/client";
import { useCallback, useEffect, useRef, useState } from "react";

export default function useTextToSpeech() {
	const [isLoading, setIsLoading] = useState(false);
	const [isSpeaking, setIsSpeaking] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const cacheRef = useRef<Map<string, string>>(new Map());

	const stop = useCallback(() => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
		}
		setIsSpeaking(false);
	}, []);

	const speak = useCallback(
		async (text: string) => {
			stop();

			const cached = cacheRef.current.get(text);
			if (cached) {
				const audio = new Audio(cached);
				audioRef.current = audio;
				audio.onplay = () => setIsSpeaking(true);
				audio.onended = () => setIsSpeaking(false);
				audio.onerror = () => setIsSpeaking(false);
				audio.play();
				return;
			}

			setIsLoading(true);
			try {
				const response = await fetch(
					`${env.VITE_SERVER_URL}/api/pronunciation/tts`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						credentials: "include",
						body: JSON.stringify({ text }),
					},
				);

				if (!response.ok) {
					throw new Error("TTS request failed");
				}

				const blob = await response.blob();
				const url = URL.createObjectURL(blob);
				cacheRef.current.set(text, url);

				const audio = new Audio(url);
				audioRef.current = audio;
				audio.onplay = () => setIsSpeaking(true);
				audio.onended = () => setIsSpeaking(false);
				audio.onerror = () => setIsSpeaking(false);
				audio.play();
			} catch (err) {
				console.error("TTS error:", err);
			} finally {
				setIsLoading(false);
			}
		},
		[stop],
	);

	useEffect(() => {
		return () => {
			if (audioRef.current) {
				audioRef.current.pause();
			}
			for (const url of cacheRef.current.values()) {
				URL.revokeObjectURL(url);
			}
			cacheRef.current.clear();
		};
	}, []);

	return { isLoading, isSpeaking, speak, stop };
}
