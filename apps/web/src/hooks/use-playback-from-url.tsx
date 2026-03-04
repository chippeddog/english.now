import { useCallback, useRef, useState } from "react";

export default function usePlaybackFromUrl() {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [playingId, setPlayingId] = useState<string | null>(null);

	const playAudio = useCallback(
		(url: string, id: string) => {
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current = null;
			}
			if (playingId === id) {
				setPlayingId(null);
				return;
			}
			const audio = new Audio(url);
			audioRef.current = audio;
			setPlayingId(id);
			audio.onended = () => {
				setPlayingId(null);
				audioRef.current = null;
			};
			audio.onerror = () => {
				setPlayingId(null);
				audioRef.current = null;
			};
			audio.play().catch(() => setPlayingId(null));
		},
		[playingId],
	);

	return {
		playingId,
		playAudio,
	};
}
