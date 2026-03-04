import { useCallback, useEffect, useRef, useState } from "react";

export function usePracticeTimer() {
	const [elapsedSeconds, setElapsedSeconds] = useState(0);
	const startTimeRef = useRef<number | null>(performance.now());
	const accumulatedMsRef = useRef(0);

	useEffect(() => {
		const interval = setInterval(() => {
			if (startTimeRef.current !== null) {
				const total =
					accumulatedMsRef.current + (performance.now() - startTimeRef.current);
				setElapsedSeconds(Math.floor(total / 1000));
			}
		}, 1000);

		const handleVisibility = () => {
			if (document.hidden) {
				if (startTimeRef.current !== null) {
					accumulatedMsRef.current += performance.now() - startTimeRef.current;
					startTimeRef.current = null;
				}
			} else {
				startTimeRef.current = performance.now();
			}
		};

		document.addEventListener("visibilitychange", handleVisibility);

		return () => {
			clearInterval(interval);
			document.removeEventListener("visibilitychange", handleVisibility);
		};
	}, []);

	const getElapsedSeconds = useCallback(() => {
		if (startTimeRef.current !== null) {
			return Math.floor(
				(accumulatedMsRef.current +
					(performance.now() - startTimeRef.current)) /
					1000,
			);
		}
		return Math.floor(accumulatedMsRef.current / 1000);
	}, []);

	return { elapsedSeconds, getElapsedSeconds };
}
