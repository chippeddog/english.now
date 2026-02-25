import { useCallback, useRef, useState } from "react";

export default function useAudioPlayback(voice: string) {
	const [isPlaying, setIsPlaying] = useState<string | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const playAudio = useCallback((audioBase64: string, messageId?: string) => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current = null;
		}

		try {
			const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
			audioRef.current = audio;

			if (messageId) {
				setIsPlaying(messageId);
			}

			audio.onended = () => {
				setIsPlaying(null);
				audioRef.current = null;
			};

			audio.onerror = () => {
				console.error("Audio playback error");
				setIsPlaying(null);
				audioRef.current = null;
			};

			audio.play().catch((err) => {
				console.error("Failed to play audio:", err);
				setIsPlaying(null);
			});
		} catch (err) {
			console.error("Error creating audio:", err);
		}
	}, []);

	return {
		isPlaying,
		setIsPlaying,
		audioRef,
		playAudio,
	};
}
