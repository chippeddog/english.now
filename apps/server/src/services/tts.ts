import {
	DEFAULT_DEEPGRAM_VOICE,
	synthesizeSpeech,
} from "@english.now/api/lib/speech";

/**
 * Generate TTS audio (Deepgram Aura, or OpenAI when Deepgram is not configured).
 * Returns raw MP3 audio as a Buffer, or null on failure.
 */
export async function generateTTS(
	text: string,
	voice = DEFAULT_DEEPGRAM_VOICE,
): Promise<Buffer | null> {
	return synthesizeSpeech(text, voice);
}

/**
 * Convenience wrapper that returns base64-encoded audio (used by conversation routes).
 */
export async function generateTTSBase64(
	text: string,
	voice = DEFAULT_DEEPGRAM_VOICE,
): Promise<string | null> {
	const buffer = await generateTTS(text, voice);
	if (!buffer) return null;
	return buffer.toString("base64");
}
