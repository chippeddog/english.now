import { createOpenAI } from "@ai-sdk/openai";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
	and,
	db,
	eq,
	phrase,
	phraseTranslation,
	word,
	wordTranslation,
} from "@english.now/db";
import { env } from "@english.now/env/server";
import { generateText, Output } from "ai";
import { z } from "zod";

const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });

const vocabularyBucket = "_vocabulary";

const s3 = new S3Client({
	region: "auto",
	endpoint: env.R2_ENDPOINT,
	credentials: {
		accessKeyId: env.R2_ACCESS_KEY_ID,
		secretAccessKey: env.R2_SECRET_ACCESS_KEY,
	},
});

// ─── Schemas ─────────────────────────────────────────────────────────────────

const wordMetadataSchema = z.object({
	definition: z.string(),
	exampleSentence: z.string(),
	partOfSpeech: z.string(),
	ipa: z.string(),
	level: z.string(),
});

const phraseMetadataSchema = z.object({
	meaning: z.string(),
	exampleUsage: z.string(),
	ipa: z.string(),
	level: z.string(),
});

const translationSchema = z.object({
	translation: z.string(),
});

const phraseTranslationSchema = z.object({
	translation: z.string(),
	literalTranslation: z.string(),
});

// ─── Validation ─────────────────────────────────────────────────────────────

const englishCheckSchema = z.object({
	isEnglish: z.boolean(),
});

/**
 * Verify that the given text is a real English word (not a foreign word,
 * gibberish, or a random string).
 */
export async function validateEnglishWord(raw: string): Promise<boolean> {
	const text = raw.trim().toLowerCase();
	if (!text || text.length > 100) return false;

	const { output } = await generateText({
		model: openai("gpt-4o-mini"),
		output: Output.object({ schema: englishCheckSchema }),
		system:
			"You are a language detector. Determine whether the given text is a valid English word. Respond with isEnglish: true only if it is a real English word. Return false for non-English words, gibberish, numbers-only strings, or random characters.",
		prompt: `Is this an English word? "${text}"`,
		temperature: 0,
	});

	return output?.isEnglish ?? false;
}

/**
 * Verify that the given text is a real English phrase or expression
 * (not foreign text, gibberish, or random characters).
 */
export async function validateEnglishPhrase(raw: string): Promise<boolean> {
	const text = raw.trim().toLowerCase();
	if (!text || text.length > 300) return false;

	const { output } = await generateText({
		model: openai("gpt-4o-mini"),
		output: Output.object({ schema: englishCheckSchema }),
		system:
			"You are a language detector. Determine whether the given text is a valid English phrase, expression, or idiom. Respond with isEnglish: true only if it is written in English. Return false for non-English text, gibberish, numbers-only strings, or random characters.",
		prompt: `Is this an English phrase? "${text}"`,
		temperature: 0,
	});

	return output?.isEnglish ?? false;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function normalizeLemma(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s'-]/gu, "")
		.trim();
}

function normalizePhrase(text: string): string {
	return text.toLowerCase().trim();
}

async function generateTTSBuffer(text: string): Promise<Buffer | null> {
	try {
		const response = await fetch(
			"https://api.deepgram.com/v1/speak?model=aura-asteria-en",
			{
				method: "POST",
				headers: {
					Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ text }),
			},
		);

		if (!response.ok) return null;

		const arrayBuffer = await response.arrayBuffer();
		return Buffer.from(arrayBuffer);
	} catch {
		return null;
	}
}

async function uploadAudioToR2(key: string, buffer: Buffer): Promise<string> {
	await s3.send(
		new PutObjectCommand({
			Bucket: vocabularyBucket,
			Key: key,
			Body: buffer,
			ContentType: "audio/mp3",
		}),
	);
	return `${env.R2_PUBLIC_URL}/${vocabularyBucket}/${key}`;
}

/**
 * Generate TTS audio, upload to R2, return public URL.
 * Returns null if TTS generation fails (non-critical).
 */
async function generateAndCacheAudio(
	text: string,
	prefix: string,
	id: string,
): Promise<string | null> {
	const buffer = await generateTTSBuffer(text);
	if (!buffer) return null;

	const key = `${prefix}/${id}.mp3`;
	return uploadAudioToR2(key, buffer);
}

// ─── Word Catalog ────────────────────────────────────────────────────────────

/**
 * Find or create a canonical word entry.
 * If the word doesn't exist, generates metadata (definition, IPA, example, POS)
 * via LLM and caches TTS audio on R2.
 */
export async function getOrCreateWord(
	rawLemma: string,
	opts?: { definition?: string; level?: string },
): Promise<string> {
	const lemma = normalizeLemma(rawLemma);

	const [existing] = await db
		.select({ id: word.id })
		.from(word)
		.where(eq(word.lemma, lemma))
		.limit(1);

	if (existing) return existing.id;

	const { output: meta } = await generateText({
		model: openai("gpt-4o-mini"),
		output: Output.object({ schema: wordMetadataSchema }),
		system:
			"You are an English dictionary. Given a word, provide its definition, an example sentence, part of speech, IPA pronunciation, and CEFR level (A1/A2/B1/B2/C1/C2). Be concise.",
		prompt: `Word: "${lemma}"`,
		temperature: 0.3,
	});

	if (!meta) throw new Error(`Failed to generate metadata for word "${lemma}"`);

	const id = crypto.randomUUID();

	const audioUrl = await generateAndCacheAudio(lemma, "words", id);

	await db.insert(word).values({
		id,
		lemma,
		ipa: meta.ipa,
		audioUrl,
		partOfSpeech: meta.partOfSpeech,
		definition: opts?.definition ?? meta.definition,
		exampleSentence: meta.exampleSentence,
		level: opts?.level ?? meta.level,
	});

	return id;
}

// ─── Phrase Catalog ──────────────────────────────────────────────────────────

/**
 * Find or create a canonical phrase entry.
 */
export async function getOrCreatePhrase(
	rawPhrase: string,
	opts?: { meaning?: string; level?: string },
): Promise<string> {
	const normalized = normalizePhrase(rawPhrase);

	const [existing] = await db
		.select({ id: phrase.id })
		.from(phrase)
		.where(eq(phrase.text, normalized))
		.limit(1);

	if (existing) return existing.id;

	const { output: meta } = await generateText({
		model: openai("gpt-4o-mini"),
		output: Output.object({ schema: phraseMetadataSchema }),
		system:
			"You are an English dictionary. Given a phrase or expression, provide its meaning, an example usage in a sentence, IPA pronunciation, and CEFR level (A1/A2/B1/B2/C1/C2). Be concise.",
		prompt: `Phrase: "${normalized}"`,
		temperature: 0.3,
	});

	if (!meta)
		throw new Error(`Failed to generate metadata for phrase "${normalized}"`);

	const id = crypto.randomUUID();

	const audioUrl = await generateAndCacheAudio(normalized, "phrases", id);

	await db.insert(phrase).values({
		id,
		text: normalized,
		ipa: meta.ipa,
		audioUrl,
		level: opts?.level ?? meta.level,
		meaning: opts?.meaning ?? meta.meaning,
		exampleUsage: meta.exampleUsage,
	});

	return id;
}

// ─── Translations ────────────────────────────────────────────────────────────

const LANGUAGE_NAMES: Record<string, string> = {
	uk: "Ukrainian",
	en: "English",
	fr: "French",
	es: "Spanish",
	de: "German",
	pt: "Portuguese",
	it: "Italian",
	pl: "Polish",
	ja: "Japanese",
	ko: "Korean",
	zh: "Chinese",
	ar: "Arabic",
	hi: "Hindi",
	tr: "Turkish",
};

function getLanguageName(code: string): string {
	return LANGUAGE_NAMES[code] ?? "Ukrainian";
}

/**
 * Ensure a translation exists for the given word + language.
 * Generates via LLM if missing.
 */
export async function ensureWordTranslation(
	wordId: string,
	language: string,
): Promise<void> {
	const [existing] = await db
		.select({ id: wordTranslation.id })
		.from(wordTranslation)
		.where(
			and(
				eq(wordTranslation.wordId, wordId),
				eq(wordTranslation.language, language),
			),
		)
		.limit(1);

	if (existing) return;

	const [w] = await db
		.select({ lemma: word.lemma })
		.from(word)
		.where(eq(word.id, wordId))
		.limit(1);

	if (!w) return;

	const langName = getLanguageName(language);

	const { output } = await generateText({
		model: openai("gpt-4o-mini"),
		output: Output.object({ schema: translationSchema }),
		system: `Translate the English word to ${langName}. Provide the most natural, commonly-used translation.`,
		prompt: `Translate: "${w.lemma}"`,
		temperature: 0.3,
	});

	if (!output) return;

	await db
		.insert(wordTranslation)
		.values({
			id: crypto.randomUUID(),
			wordId,
			language,
			translation: output.translation,
		})
		.onConflictDoNothing();
}

/**
 * Ensure a translation exists for the given phrase + language.
 * Generates via LLM if missing.
 */
export async function ensurePhraseTranslation(
	phraseId: string,
	language: string,
): Promise<void> {
	const [existing] = await db
		.select({ id: phraseTranslation.id })
		.from(phraseTranslation)
		.where(
			and(
				eq(phraseTranslation.phraseId, phraseId),
				eq(phraseTranslation.language, language),
			),
		)
		.limit(1);

	if (existing) return;

	const [p] = await db
		.select({ text: phrase.text })
		.from(phrase)
		.where(eq(phrase.id, phraseId))
		.limit(1);

	if (!p) return;

	const langName = getLanguageName(language);

	const { output } = await generateText({
		model: openai("gpt-4o-mini"),
		output: Output.object({ schema: phraseTranslationSchema }),
		system: `Translate the English phrase/expression to ${langName}. Provide both a natural translation and a literal (word-by-word) translation.`,
		prompt: `Translate: "${p.text}"`,
		temperature: 0.3,
	});

	if (!output) return;

	await db
		.insert(phraseTranslation)
		.values({
			id: crypto.randomUUID(),
			phraseId,
			language,
			translation: output.translation,
			literalTranslation: output.literalTranslation,
		})
		.onConflictDoNothing();
}
