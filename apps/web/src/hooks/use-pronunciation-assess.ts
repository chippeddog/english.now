import { env } from "@english.now/env/client";
import { useCallback, useState } from "react";

function blobToBase64(blob: Blob): Promise<string> {
	return blob.arrayBuffer().then((buffer) => {
		const bytes = new Uint8Array(buffer);
		let binary = "";
		for (const byte of bytes) {
			binary += String.fromCharCode(byte);
		}
		return btoa(binary);
	});
}

export type PronunciationAssessResult = {
	pronunciationScore: number;
	transcript: string;
	accuracyScore?: number;
	fluencyScore?: number;
	completenessScore?: number;
	prosodyScore?: number;
	audioUrl?: string;
};

export function usePronunciationAssess() {
	const [isAssessing, setIsAssessing] = useState(false);

	const assess = useCallback(async (blob: Blob, referenceText: string) => {
		setIsAssessing(true);
		try {
			const audio = await blobToBase64(blob);
			const response = await fetch(
				`${env.VITE_SERVER_URL}/api/pronunciation/assess`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						audio,
						referenceText,
					}),
				},
			);

			if (!response.ok) {
				const err = (await response.json().catch(() => ({}))) as {
					details?: string;
				};
				throw new Error(err.details ?? "Pronunciation assessment failed");
			}

			return (await response.json()) as PronunciationAssessResult;
		} finally {
			setIsAssessing(false);
		}
	}, []);

	return { isAssessing, assess };
}
