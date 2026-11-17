import { capabilities, env } from "@english.now/env/server";

export const DEFAULT_DEEPGRAM_VOICE = "aura-asteria-en";
const OPENAI_TTS_MODEL = "tts-1";
const OPENAI_TTS_VOICE = "alloy";
const OPENAI_TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe";

export type TranscriptionResult = {
	transcript: string;
	confidence: number;
};

/**
 * Text-to-speech. Uses Deepgram Aura when configured, otherwise OpenAI.
 * Returns MP3 audio, or null on failure.
 */
export async function synthesizeSpeech(
	text: string,
	voice: string = DEFAULT_DEEPGRAM_VOICE,
): Promise<Buffer | null> {
	try {
		const response = capabilities.deepgram
			? await fetch(
					`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(voice)}`,
					{
						method: "POST",
						headers: {
							Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ text }),
					},
				)
			: await fetch("https://api.openai.com/v1/audio/speech", {
					method: "POST",
					headers: {
						Authorization: `Bearer ${env.OPENAI_API_KEY}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						model: OPENAI_TTS_MODEL,
						voice: OPENAI_TTS_VOICE,
						input: text,
						response_format: "mp3",
					}),
				});

		if (!response.ok) {
			console.error("[speech] TTS error:", await response.text());
			return null;
		}

		return Buffer.from(await response.arrayBuffer());
	} catch (error) {
		console.error("[speech] TTS generation error:", error);
		return null;
	}
}

/**
 * Speech-to-text for a complete recording. Uses Deepgram when configured,
 * otherwise OpenAI transcription.
 */
export async function transcribeAudio(
	audio: Buffer,
	mimeType: string,
): Promise<TranscriptionResult> {
	if (capabilities.deepgram) {
		const response = await fetch(
			"https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en",
			{
				method: "POST",
				headers: {
					Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
					"Content-Type": mimeType,
				},
				body: new Uint8Array(audio),
			},
		);

		if (!response.ok) {
			console.error("[speech] Deepgram error:", await response.text());
			throw new Error(`Deepgram API error: ${response.status}`);
		}

		const result = (await response.json()) as {
			results?: {
				channels?: Array<{
					alternatives?: Array<{ transcript?: string; confidence?: number }>;
				}>;
			};
		};
		const alternative = result.results?.channels?.[0]?.alternatives?.[0];
		return {
			transcript: alternative?.transcript ?? "",
			confidence: alternative?.confidence ?? 0,
		};
	}

	const extension = mimeType.split("/")[1]?.split(";")[0] ?? "webm";
	const form = new FormData();
	form.append(
		"file",
		new Blob([new Uint8Array(audio)], { type: mimeType }),
		`audio.${extension === "mpeg" ? "mp3" : extension}`,
	);
	form.append("model", OPENAI_TRANSCRIBE_MODEL);
	form.append("language", "en");

	const response = await fetch(
		"https://api.openai.com/v1/audio/transcriptions",
		{
			method: "POST",
			headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
			body: form,
		},
	);

	if (!response.ok) {
		console.error(
			"[speech] OpenAI transcription error:",
			await response.text(),
		);
		throw new Error(`OpenAI transcription error: ${response.status}`);
	}

	const result = (await response.json()) as { text?: string };
	return { transcript: result.text ?? "", confidence: 1 };
}
