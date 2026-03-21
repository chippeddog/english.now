import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getConversationSessionMeta } from "@english.now/api/services/conversation-mode";
import { buildConversationReviewGuidance } from "@english.now/api/services/conversation-prompt";
import {
	type ConversationReview,
	type ConversationReviewInlineSegment,
	type ConversationReviewPracticeVariant,
	type ConversationReviewProblem,
	type ConversationReviewTask,
	type ConversationReviewTranscriptSpan,
	conversationMessage,
	conversationSession,
	db,
	eq,
} from "@english.now/db";
import { generateText, Output } from "ai";
import { z } from "zod";
import { openai } from "../utils/ai";
import s3Client from "../utils/r2";
import {
	assessPronunciation,
	type PronunciationAssessmentResult,
	type WordResult,
} from "./pronunciation-assessment";

const MIN_USER_MESSAGES = 3;
/** OpenAI structured outputs need finite `maxItems`; keep high for “full” reviews. */
const MAX_GRAMMAR_ISSUES = 100;
const MAX_VOCAB_ISSUES = 100;

const reviewAnalysisSchema = z.object({
	grammarScore: z
		.number()
		.min(0)
		.max(100)
		.describe("Grammar correctness score from 0 to 100."),
	vocabularyScore: z
		.number()
		.min(0)
		.max(100)
		.describe("Vocabulary range and appropriateness score from 0 to 100."),
	grammarProblems: z
		.array(
			z.object({
				sourceText: z.string(),
				suggestedText: z.string(),
				explanation: z.string(),
				severity: z.enum(["low", "medium", "high"]),
				subtype: z
					.string()
					.optional()
					.describe(
						"Short grammar focus label, e.g. Articles, Verb tense. Optional.",
					),
				inlineSegments: z
					.array(z.unknown())
					.optional()
					.describe(
						"Optional ordered fragments: {type:'text', text} and {type:'pair', wrong, right}. Omitted is OK.",
					),
				practiceVariant: z
					.enum(["repeat", "question-transform", "fill-blank"])
					.optional()
					.describe(
						"Optional practice mode: repeat corrected sentence, transform to a question, or fill-blank style. Default repeat.",
					),
			}),
		)
		.max(MAX_GRAMMAR_ISSUES)
		.describe(
			`All distinct grammar issues in the session (max ${MAX_GRAMMAR_ISSUES}).`,
		),
	vocabularyProblems: z
		.array(
			z.object({
				sourceText: z.string(),
				suggestedText: z.string(),
				explanation: z.string(),
				severity: z.enum(["low", "medium", "high"]),
				taskType: z.enum(["swap-word", "rephrase"]),
				vocabularyItems: z
					.preprocess(
						(val) => (Array.isArray(val) ? val : []),
						z.array(z.string()).max(3),
					)
					.describe("0–3 related words or phrases to save; use [] if none."),
				subtype: z
					.string()
					.optional()
					.describe(
						"Short label e.g. Word choice, Collocation. If omitted, UI infers from task type.",
					),
				inlineSegments: z
					.array(z.unknown())
					.optional()
					.describe("Optional inline segments like grammar. Omitted is OK."),
				alternatives: z
					.array(z.string())
					.max(2)
					.optional()
					.describe(
						"Optional 1–2 alternative natural phrasings (not identical to suggestedText).",
					),
				practiceVariant: z
					.enum(["repeat", "choose-option", "personalize"])
					.optional()
					.describe(
						"Optional practice mode. Default repeat for swap-word, personalize-friendly for rephrase.",
					),
			}),
		)
		.max(MAX_VOCAB_ISSUES)
		.describe(
			`All distinct vocabulary improvements in the session (max ${MAX_VOCAB_ISSUES}).`,
		),
});

const fallbackReviewAnalysisSchema = z.object({
	grammarScore: z.number().min(0).max(100),
	vocabularyScore: z.number().min(0).max(100),
	grammarProblems: z
		.array(
			z.object({
				sourceText: z.string(),
				suggestedText: z.string(),
				explanation: z.string(),
				severity: z.enum(["low", "medium", "high"]),
			}),
		)
		.max(MAX_GRAMMAR_ISSUES),
	vocabularyProblems: z
		.array(
			z.object({
				sourceText: z.string(),
				suggestedText: z.string(),
				explanation: z.string(),
				severity: z.enum(["low", "medium", "high"]),
				taskType: z.enum(["swap-word", "rephrase"]),
				vocabularyItems: z.preprocess(
					(val) => (Array.isArray(val) ? val : []),
					z.array(z.string()).max(3),
				),
			}),
		)
		.max(MAX_VOCAB_ISSUES),
});

type ReviewAnalysis = z.infer<typeof reviewAnalysisSchema>;
type GrammarAnalysisItem = ReviewAnalysis["grammarProblems"][number];
type VocabularyAnalysisItem = ReviewAnalysis["vocabularyProblems"][number];

const GRAMMAR_SUBTYPE_LABELS = [
	"Articles",
	"Verb tense",
	"Agreement",
	"Prepositions",
	"Pronouns",
	"Word order",
	"Question form",
	"Plural / singular",
	"Sentence structure",
	"Grammar fix",
] as const;
type GrammarSubtypeLabel = (typeof GRAMMAR_SUBTYPE_LABELS)[number];

function expandFallbackReviewAnalysis(
	data: z.infer<typeof fallbackReviewAnalysisSchema>,
): z.infer<typeof reviewAnalysisSchema> {
	return {
		grammarScore: data.grammarScore,
		vocabularyScore: data.vocabularyScore,
		grammarProblems: data.grammarProblems.map((item) => ({ ...item })),
		vocabularyProblems: data.vocabularyProblems.map((item) => ({ ...item })),
	};
}

const TRANSCRIPT_AWARE_REVIEW_RULES = `- These learner lines may be automatic speech-to-text transcripts from casual conversation.
- Do NOT flag commas, periods, capitalization, sentence-final punctuation, or paragraph formatting by themselves.
- Do NOT treat likely ASR transcription artifacts as mistakes: missing apostrophes, odd commas/dots, casing noise, or minor transcript formatting issues.
- Do NOT flag article-only fixes from voice transcription (for example adding "a/an/the") unless the learner's wording is clearly broken or confusing without it.
- In spoken conversation, natural fragments are acceptable; only flag them if they are genuinely ungrammatical, confusing, or unnatural in context.
- Focus on real spoken-English issues: tense, articles, prepositions, agreement, pronouns, word order, word choice, and natural phrasing.
- If the only issue is punctuation or transcript formatting, return no issue for that line.
- Never return the same issue in both grammarProblems and vocabularyProblems. A correction must belong to exactly one category.
- Grammar is for correctness/form/structure. Vocabulary is for word choice, collocation, nuance, or more natural phrasing.`;

function normalizeGrammarSubtype(
	subtype: string | undefined,
	sourceText: string,
	suggestedText: string,
	explanation: string,
): GrammarSubtypeLabel {
	const raw = [subtype, explanation].filter(Boolean).join(" ").toLowerCase();
	const sourceTokens = normalizeForTranscriptComparison(sourceText);
	const suggestedTokens = normalizeForTranscriptComparison(suggestedText);
	const { onlySource, onlySuggested } = multisetTokenDiff(
		sourceTokens,
		suggestedTokens,
	);
	const changed = [...onlySource, ...onlySuggested].join(" ");

	if (
		raw.includes("article") ||
		raw.includes("determiner") ||
		/\b(a|an|the)\b/.test(changed)
	) {
		return "Articles";
	}
	if (
		raw.includes("tense") ||
		raw.includes("verb form") ||
		raw.includes("conjugat") ||
		raw.includes("past") ||
		raw.includes("present") ||
		raw.includes("future")
	) {
		return "Verb tense";
	}
	if (
		raw.includes("agreement") ||
		raw.includes("subject-verb") ||
		raw.includes("subject verb")
	) {
		return "Agreement";
	}
	if (
		raw.includes("preposition") ||
		/\b(in|on|at|to|for|from|with|by)\b/.test(changed)
	) {
		return "Prepositions";
	}
	if (
		raw.includes("pronoun") ||
		/\b(i|you|he|she|we|they|me|him|her|us|them|my|your|his|their|our)\b/.test(
			changed,
		)
	) {
		return "Pronouns";
	}
	if (
		raw.includes("word order") ||
		raw.includes("order") ||
		raw.includes("syntax")
	) {
		return "Word order";
	}
	if (raw.includes("question") || raw.includes("auxiliary")) {
		return "Question form";
	}
	if (
		raw.includes("plural") ||
		raw.includes("singular") ||
		raw.includes("countable") ||
		raw.includes("uncountable")
	) {
		return "Plural / singular";
	}
	if (
		raw.includes("sentence structure") ||
		raw.includes("sentence") ||
		raw.includes("clause")
	) {
		return "Sentence structure";
	}
	return "Grammar fix";
}

function normalizeInlineSegments(
	raw: unknown,
	sourceText: string,
	suggestedText: string,
): ConversationReviewInlineSegment[] {
	if (!Array.isArray(raw) || raw.length === 0) {
		return [{ type: "pair", wrong: sourceText, right: suggestedText }];
	}
	const out: ConversationReviewInlineSegment[] = [];
	for (const item of raw) {
		if (!item || typeof item !== "object") continue;
		const o = item as Record<string, unknown>;
		if (o.type === "text" && typeof o.text === "string") {
			out.push({ type: "text", text: o.text });
		} else if (
			o.type === "pair" &&
			typeof o.wrong === "string" &&
			typeof o.right === "string"
		) {
			out.push({ type: "pair", wrong: o.wrong, right: o.right });
		}
	}
	return out.length > 0
		? out
		: [{ type: "pair", wrong: sourceText, right: suggestedText }];
}

function emptyReview(
	availability: "ready" | "not_enough_messages",
): ConversationReview {
	return {
		availability,
		overallScore: null,
		scores: {
			grammar: null,
			vocabulary: null,
			pronunciation: null,
		},
		problems: [],
		tasks: [],
		stats: {
			totalProblems: 0,
			totalTasks: 0,
		},
	};
}

async function downloadAudioFromR2(audioUrl: string): Promise<Buffer | null> {
	try {
		const url = new URL(audioUrl);
		const key = url.pathname.replace(/^\/_audio\//, "");

		const response = await s3Client.send(
			new GetObjectCommand({
				Bucket: "_audio",
				Key: key,
			}),
		);

		if (!response.Body) return null;
		const bytes = await response.Body.transformToByteArray();
		return Buffer.from(bytes);
	} catch (err) {
		console.error("[feedback] Failed to download audio:", audioUrl, err);
		return null;
	}
}

async function assessVoiceMessages(
	voiceMessages: Array<{
		id: string;
		content: string;
		audioUrl: string;
	}>,
): Promise<{
	pronunciationScore: number | null;
	results: Array<
		PronunciationAssessmentResult & {
			messageId: string;
			referenceText: string;
		}
	>;
}> {
	const results: Array<
		PronunciationAssessmentResult & {
			messageId: string;
			referenceText: string;
		}
	> = [];

	for (const msg of voiceMessages) {
		try {
			const audioBuffer = await downloadAudioFromR2(msg.audioUrl);
			if (!audioBuffer) continue;

			const result = await assessPronunciation(audioBuffer, msg.content);
			results.push({
				...result,
				messageId: msg.id,
				referenceText: msg.content,
			});
		} catch (err) {
			console.error(
				"[feedback] Pronunciation assessment failed for message",
				err,
			);
		}
	}

	if (results.length === 0) {
		return { pronunciationScore: null, results: [] };
	}

	const avgScore =
		results.reduce((sum, item) => sum + item.pronunciationScore, 0) /
		results.length;

	return { pronunciationScore: Math.round(avgScore), results };
}

async function analyzeWithAI(
	turns: Array<{
		userMessage: {
			id: string;
			content: string;
			inputMode: "voice" | "text";
		};
		assistantMessage?: string;
	}>,
	level: string,
	sessionGuidance?: string,
): Promise<z.infer<typeof reviewAnalysisSchema>> {
	const conversationPairs = turns
		.map(
			({ userMessage, assistantMessage }) =>
				`Learner (${userMessage.inputMode === "voice" ? "voice transcript" : "typed"}): ${userMessage.content}${assistantMessage ? `\nAssistant: ${assistantMessage}` : ""}`,
		)
		.join("\n\n");

	const empty: z.infer<typeof reviewAnalysisSchema> = {
		grammarScore: 75,
		vocabularyScore: 75,
		grammarProblems: [],
		vocabularyProblems: [],
	};

	try {
		const { experimental_output } = await generateText({
			model: openai("gpt-4o"),
			output: Output.object({ schema: reviewAnalysisSchema }),
			system: `You are an expert English coach reviewing one conversation practice session.
The learner is at a "${level}" level.
${sessionGuidance ? `\n${sessionGuidance}` : ""}

Return a complete, high-quality review of all meaningful grammar and vocabulary issues in this session.
- Focus ONLY on grammar and vocabulary.
- Do NOT return summary prose, strengths, fluency notes, or generic encouragement.
- Review every learner turn carefully.
- Treat this as spoken conversation, not polished written prose.
- Typed learner messages should be judged normally.
- Voice-transcript learner messages should be judged leniently for transcription noise, but still flag genuinely wrong or unnatural English.
- Quote exact learner wording in sourceText.
- suggestedText must be the improved full sentence or phrase the learner should practice next.
- For grammar: subtype should preferably be one of: Articles, Verb tense, Agreement, Prepositions, Pronouns, Word order, Question form, Plural / singular, Sentence structure. inlineSegments MUST reconstruct the full corrected sentence in reading order: alternate {type:"text",text} (unchanged chunks, include spaces/punctuation) with {type:"pair",wrong,right,order?} for each mistake. Use order "right-first" (default) to show the green correction before the struck learner wording; use "wrong-first" when the error should appear first (e.g. ~~our~~ your). If unsure, omit inlineSegments. Optionally set practiceVariant to "repeat", "question-transform", or "fill-blank" when a different drill fits.
- For vocabulary problems, inlineSegments and subtype are optional. Optionally include alternatives (1–2 other natural phrasings) and practiceVariant "repeat" | "choose-option" | "personalize".
- explanations: short and useful; for grammar you may wrap key terms in **double asterisks** for bold in the app.
- Do not under-report just to keep the review short.
- Include every distinct grammar issue worth fixing across the learner turns (one array item per issue; empty array if none). You may return up to ${MAX_GRAMMAR_ISSUES} grammar items.
- Include every distinct vocabulary improvement opportunity (one array item per issue; empty array if none). You may return up to ${MAX_VOCAB_ISSUES} vocabulary items.
- vocabularyItems: 0–3 words or short phrases per item; use [] when none.
${TRANSCRIPT_AWARE_REVIEW_RULES}`,
			prompt: `Analyze this conversation practice session:\n\n${conversationPairs}`,
			temperature: 0.3,
		});

		if (!experimental_output) {
			console.error("[feedback] AI analysis returned no structured output");
		} else {
			return experimental_output;
		}
	} catch (err) {
		console.error(
			"[feedback] Rich AI analysis failed; trying simplified fallback",
			err,
		);
	}

	try {
		const { experimental_output } = await generateText({
			model: openai("gpt-4o"),
			output: Output.object({ schema: fallbackReviewAnalysisSchema }),
			system: `You are an expert English coach reviewing one spoken English conversation.
The learner is at a "${level}" level.
${sessionGuidance ? `\n${sessionGuidance}` : ""}

Return complete structured grammar and vocabulary review data.
- Focus ONLY on grammar and vocabulary.
- Review every learner turn carefully.
- Use the learner's exact wording in sourceText.
- suggestedText must be the improved sentence or phrase to practice next.
- explanations must be short and useful.
- Return every real grammar or vocabulary issue you see, but ignore punctuation-only transcript noise.
- Do not keep the review artificially short.
${TRANSCRIPT_AWARE_REVIEW_RULES}`,
			prompt: `Analyze this conversation practice session:\n\n${conversationPairs}`,
			temperature: 0.2,
		});

		if (!experimental_output) {
			console.error("[feedback] Fallback AI analysis returned no output");
			return empty;
		}

		return expandFallbackReviewAnalysis(experimental_output);
	} catch (err) {
		console.error(
			"[feedback] Fallback AI analysis failed; continuing with empty grammar/vocabulary",
			err,
		);
		return empty;
	}
}

function buildConversationTurns(
	messages: Array<{
		id: string;
		role: string;
		content: string;
		audioUrl?: string | null;
		metadata?: { transcribedFrom?: "voice" | "text" } | null;
	}>,
) {
	const turns: Array<{
		userMessage: {
			id: string;
			content: string;
			inputMode: "voice" | "text";
		};
		assistantMessage?: string;
	}> = [];

	for (const message of messages) {
		if (message.role === "user") {
			turns.push({
				userMessage: {
					id: message.id,
					content: message.content,
					inputMode:
						message.audioUrl || message.metadata?.transcribedFrom === "voice"
							? "voice"
							: "text",
				},
			});
			continue;
		}

		if (message.role !== "assistant") {
			continue;
		}

		const lastTurn = turns.at(-1);
		if (lastTurn && !lastTurn.assistantMessage) {
			lastTurn.assistantMessage = message.content;
		}
	}

	return turns;
}

function findMessageIdForText(
	messages: Array<{ id: string; content: string }>,
	sourceText: string,
) {
	const normalizedSource = sourceText.trim().toLowerCase();
	return (
		messages.find((message) =>
			message.content.toLowerCase().includes(normalizedSource),
		)?.id ?? null
	);
}

function normalizeForTranscriptComparison(text: string): string[] {
	return text
		.toLowerCase()
		.normalize("NFKC")
		.replace(/[’']/g, "")
		.replace(/[.,!?;:()[\]{}"“”]/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.split(" ")
		.filter(Boolean);
}

/**
 * Voice transcripts often miss articles or punctuation. If the only difference
 * is punctuation/casing/apostrophes or added/removed articles, skip the issue.
 */
function isLikelyTranscriptOnlyDiff(
	sourceText: string,
	suggestedText: string,
): boolean {
	const sourceTokens = normalizeForTranscriptComparison(sourceText);
	const suggestedTokens = normalizeForTranscriptComparison(suggestedText);
	if (sourceTokens.length === 0 || suggestedTokens.length === 0) return false;

	if (sourceTokens.join(" ") === suggestedTokens.join(" ")) {
		return true;
	}

	const articleWords = new Set(["a", "an", "the"]);
	const sourceSansArticles = sourceTokens.filter((t) => !articleWords.has(t));
	const suggestedSansArticles = suggestedTokens.filter(
		(t) => !articleWords.has(t),
	);
	return sourceSansArticles.join(" ") === suggestedSansArticles.join(" ");
}

const FUNCTION_WORDS = new Set([
	"a",
	"an",
	"the",
	"to",
	"of",
	"in",
	"on",
	"at",
	"for",
	"with",
	"from",
	"by",
	"as",
	"is",
	"am",
	"are",
	"was",
	"were",
	"be",
	"been",
	"being",
	"do",
	"does",
	"did",
	"have",
	"has",
	"had",
	"will",
	"would",
	"can",
	"could",
	"should",
	"may",
	"might",
	"must",
	"and",
	"or",
	"but",
	"if",
	"than",
	"that",
	"this",
	"these",
	"those",
	"my",
	"your",
	"his",
	"her",
	"its",
	"our",
	"their",
	"me",
	"him",
	"them",
	"us",
	"i",
	"you",
	"he",
	"she",
	"we",
	"they",
]);

type ReviewBucket = "grammar" | "vocabulary" | "transcript_noise";
type RawReviewCandidate =
	| { kind: "grammar"; item: GrammarAnalysisItem; order: number }
	| { kind: "vocabulary"; item: VocabularyAnalysisItem; order: number };

function normalizedPairKey(sourceText: string, suggestedText: string): string {
	return `${normalizeForTranscriptComparison(sourceText).join(" ")}=>${normalizeForTranscriptComparison(suggestedText).join(" ")}`;
}

function multisetTokenDiff(sourceTokens: string[], suggestedTokens: string[]) {
	const left = new Map<string, number>();
	const right = new Map<string, number>();
	for (const token of sourceTokens) {
		left.set(token, (left.get(token) ?? 0) + 1);
	}
	for (const token of suggestedTokens) {
		right.set(token, (right.get(token) ?? 0) + 1);
	}

	const onlySource: string[] = [];
	const onlySuggested: string[] = [];
	for (const [token, count] of left) {
		const extra = count - (right.get(token) ?? 0);
		for (let i = 0; i < extra; i++) {
			if (extra > 0) onlySource.push(token);
		}
	}
	for (const [token, count] of right) {
		const extra = count - (left.get(token) ?? 0);
		for (let i = 0; i < extra; i++) {
			if (extra > 0) onlySuggested.push(token);
		}
	}
	return { onlySource, onlySuggested };
}

function normalizeLexeme(word: string): string {
	return word
		.toLowerCase()
		.normalize("NFKC")
		.replace(/[^a-z0-9]/g, "");
}

function levenshtein(a: string, b: string): number {
	if (a === b) return 0;
	if (!a.length) return b.length;
	if (!b.length) return a.length;
	const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
		Array.from({ length: b.length + 1 }, (_, j) =>
			i === 0 ? j : j === 0 ? i : 0,
		),
	);
	for (let i = 1; i <= a.length; i++) {
		for (let j = 1; j <= b.length; j++) {
			const currentRow = dp[i];
			const prevRow = dp[i - 1];
			if (!currentRow || !prevRow) continue;
			currentRow[j] = Math.min(
				(prevRow[j] ?? 0) + 1,
				(currentRow[j - 1] ?? 0) + 1,
				(prevRow[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1),
			);
		}
	}
	return dp[a.length]?.[b.length] ?? 0;
}

function consonantSkeleton(word: string): string {
	return normalizeLexeme(word)
		.replace(/[aeiouy]/g, "")
		.replace(/(.)\1+/g, "$1");
}

function possibleBaseForms(word: string): Set<string> {
	const w = normalizeLexeme(word);
	const out = new Set<string>([w]);
	if (w.endsWith("ies") && w.length > 4) out.add(`${w.slice(0, -3)}y`);
	if (w.endsWith("es") && w.length > 3) out.add(w.slice(0, -2));
	if (w.endsWith("s") && w.length > 3) out.add(w.slice(0, -1));
	if (w.endsWith("ied") && w.length > 4) out.add(`${w.slice(0, -3)}y`);
	if (w.endsWith("ed") && w.length > 3) out.add(w.slice(0, -2));
	if (w.endsWith("ing") && w.length > 5) {
		out.add(w.slice(0, -3));
		const trimmed = w.slice(0, -3);
		if (trimmed.length > 2 && trimmed.at(-1) === trimmed.at(-2)) {
			out.add(trimmed.slice(0, -1));
		}
	}
	return out;
}

function looksLikeInflectionVariant(sourceWord: string, suggestedWord: string) {
	const sourceBases = possibleBaseForms(sourceWord);
	const suggestedBases = possibleBaseForms(suggestedWord);
	for (const base of sourceBases) {
		if (suggestedBases.has(base)) return true;
	}
	return false;
}

function looksLikeMisheardContentWord(
	sourceWord: string,
	suggestedWord: string,
): boolean {
	const source = normalizeLexeme(sourceWord);
	const suggested = normalizeLexeme(suggestedWord);
	if (!source || !suggested) return false;
	if (source === suggested) return true;
	if (
		consonantSkeleton(source) &&
		consonantSkeleton(source) === consonantSkeleton(suggested)
	) {
		return true;
	}
	const distance = levenshtein(source, suggested);
	return (
		distance <=
		Math.max(1, Math.floor(Math.min(source.length, suggested.length) / 3))
	);
}

function guessVocabularyTaskType(
	sourceText: string,
	suggestedText: string,
): "swap-word" | "rephrase" {
	const sourceTokens = normalizeForTranscriptComparison(sourceText);
	const suggestedTokens = normalizeForTranscriptComparison(suggestedText);
	const { onlySource, onlySuggested } = multisetTokenDiff(
		sourceTokens,
		suggestedTokens,
	);
	return onlySource.length <= 2 && onlySuggested.length <= 2
		? "swap-word"
		: "rephrase";
}

function guessVocabularyItems(
	sourceText: string,
	suggestedText: string,
): string[] {
	const sourceTokens = normalizeForTranscriptComparison(sourceText);
	const suggestedTokens = normalizeForTranscriptComparison(suggestedText);
	const { onlySuggested } = multisetTokenDiff(sourceTokens, suggestedTokens);
	const content = onlySuggested.filter((token) => !FUNCTION_WORDS.has(token));
	const unique = [...new Set(content)];
	if (unique.length > 0) return unique.slice(0, 3);
	const trimmed = suggestedText.trim();
	return trimmed ? [trimmed].slice(0, 3) : [];
}

function chooseReviewBucket(
	sourceText: string,
	suggestedText: string,
	isVoice: boolean,
	hasGrammarCandidate: boolean,
	hasVocabularyCandidate: boolean,
): ReviewBucket {
	if (isVoice && isLikelyTranscriptOnlyDiff(sourceText, suggestedText)) {
		return "transcript_noise";
	}

	const sourceTokens = normalizeForTranscriptComparison(sourceText);
	const suggestedTokens = normalizeForTranscriptComparison(suggestedText);
	if (sourceTokens.length === 0 || suggestedTokens.length === 0) {
		return hasGrammarCandidate ? "grammar" : "vocabulary";
	}

	const { onlySource, onlySuggested } = multisetTokenDiff(
		sourceTokens,
		suggestedTokens,
	);
	const contentOnlySource = onlySource.filter(
		(token) => !FUNCTION_WORDS.has(token),
	);
	const contentOnlySuggested = onlySuggested.filter(
		(token) => !FUNCTION_WORDS.has(token),
	);
	const functionDiffCount =
		onlySource.length +
		onlySuggested.length -
		contentOnlySource.length -
		contentOnlySuggested.length;

	if (
		isVoice &&
		contentOnlySource.length === 1 &&
		contentOnlySuggested.length === 1 &&
		looksLikeMisheardContentWord(
			contentOnlySource[0] ?? "",
			contentOnlySuggested[0] ?? "",
		)
	) {
		return "transcript_noise";
	}

	if (contentOnlySource.length === 0 && contentOnlySuggested.length === 0) {
		return functionDiffCount > 0 ? "grammar" : "transcript_noise";
	}

	if (
		contentOnlySource.length === 1 &&
		contentOnlySuggested.length === 1 &&
		looksLikeInflectionVariant(
			contentOnlySource[0] ?? "",
			contentOnlySuggested[0] ?? "",
		)
	) {
		return "grammar";
	}

	if (contentOnlySource.length > 0 || contentOnlySuggested.length > 0) {
		return "vocabulary";
	}

	if (hasGrammarCandidate && !hasVocabularyCandidate) return "grammar";
	if (hasVocabularyCandidate && !hasGrammarCandidate) return "vocabulary";
	return "grammar";
}

function toGrammarAnalysisItem(
	candidate: RawReviewCandidate,
): GrammarAnalysisItem {
	if (candidate.kind === "grammar") return candidate.item;
	return {
		sourceText: candidate.item.sourceText,
		suggestedText: candidate.item.suggestedText,
		explanation: candidate.item.explanation,
		severity: candidate.item.severity,
		subtype: "Grammar",
		inlineSegments: candidate.item.inlineSegments,
		practiceVariant: "repeat",
	};
}

function toVocabularyAnalysisItem(
	candidate: RawReviewCandidate,
): VocabularyAnalysisItem {
	if (candidate.kind === "vocabulary") return candidate.item;
	return {
		sourceText: candidate.item.sourceText,
		suggestedText: candidate.item.suggestedText,
		explanation: candidate.item.explanation,
		severity: candidate.item.severity,
		taskType: guessVocabularyTaskType(
			candidate.item.sourceText,
			candidate.item.suggestedText,
		),
		vocabularyItems: guessVocabularyItems(
			candidate.item.sourceText,
			candidate.item.suggestedText,
		),
		subtype: "Word choice",
		inlineSegments: candidate.item.inlineSegments,
		practiceVariant: "repeat",
	};
}

function splitAndClassifyReviewAnalysis(
	analysis: ReviewAnalysis,
	userMessages: Array<{ id: string; content: string }>,
	voiceMessageIds: Set<string>,
): {
	grammarProblems: GrammarAnalysisItem[];
	vocabularyProblems: VocabularyAnalysisItem[];
} {
	const grouped = new Map<
		string,
		{
			sourceText: string;
			suggestedText: string;
			messageId?: string;
			isVoice: boolean;
			firstOrder: number;
			candidates: RawReviewCandidate[];
		}
	>();

	const raw: RawReviewCandidate[] = [
		...analysis.grammarProblems.map((item, index) => ({
			kind: "grammar" as const,
			item,
			order: index,
		})),
		...analysis.vocabularyProblems.map((item, index) => ({
			kind: "vocabulary" as const,
			item,
			order: analysis.grammarProblems.length + index,
		})),
	];

	for (const candidate of raw) {
		const key = normalizedPairKey(
			candidate.item.sourceText,
			candidate.item.suggestedText,
		);
		const messageId =
			findMessageIdForText(userMessages, candidate.item.sourceText) ??
			undefined;
		const existing = grouped.get(key);
		if (existing) {
			existing.candidates.push(candidate);
			if (!existing.messageId && messageId) existing.messageId = messageId;
			existing.isVoice =
				existing.isVoice ||
				Boolean(messageId && voiceMessageIds.has(messageId));
			continue;
		}
		grouped.set(key, {
			sourceText: candidate.item.sourceText,
			suggestedText: candidate.item.suggestedText,
			messageId,
			isVoice: Boolean(messageId && voiceMessageIds.has(messageId)),
			firstOrder: candidate.order,
			candidates: [candidate],
		});
	}

	const grammarProblems: Array<{ order: number; item: GrammarAnalysisItem }> =
		[];
	const vocabularyProblems: Array<{
		order: number;
		item: VocabularyAnalysisItem;
	}> = [];

	for (const group of grouped.values()) {
		const hasGrammarCandidate = group.candidates.some(
			(c) => c.kind === "grammar",
		);
		const hasVocabularyCandidate = group.candidates.some(
			(c) => c.kind === "vocabulary",
		);
		const bucket = chooseReviewBucket(
			group.sourceText,
			group.suggestedText,
			group.isVoice,
			hasGrammarCandidate,
			hasVocabularyCandidate,
		);
		if (bucket === "transcript_noise") continue;

		const matchingCandidate =
			group.candidates.find((c) => c.kind === bucket) ?? group.candidates[0];
		if (!matchingCandidate) continue;

		if (bucket === "grammar") {
			grammarProblems.push({
				order: group.firstOrder,
				item: toGrammarAnalysisItem(matchingCandidate),
			});
		} else {
			vocabularyProblems.push({
				order: group.firstOrder,
				item: toVocabularyAnalysisItem(matchingCandidate),
			});
		}
	}

	grammarProblems.sort((a, b) => a.order - b.order);
	vocabularyProblems.sort((a, b) => a.order - b.order);

	return {
		grammarProblems: grammarProblems.map((entry) => entry.item),
		vocabularyProblems: vocabularyProblems.map((entry) => entry.item),
	};
}

/** UTF-16 indices; tries exact substring then case-insensitive (same-length segments). */
function findUtf16SpanInText(
	haystack: string,
	needle: string,
): { start: number; end: number } | null {
	const t = needle.trim();
	if (!t) return null;
	let idx = haystack.indexOf(t);
	if (idx >= 0) return { start: idx, end: idx + t.length };
	const hl = haystack.toLowerCase();
	const tl = t.toLowerCase();
	idx = hl.indexOf(tl);
	if (idx < 0) return null;
	const end = idx + t.length;
	if (haystack.slice(idx, end).toLowerCase() !== tl) return null;
	return { start: idx, end };
}

function findWordUtf16Span(
	sentence: string,
	word: string,
): { start: number; end: number } | null {
	const w = word.trim();
	if (!w) return null;
	const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const re = new RegExp(`\\b${escaped}\\b`, "i");
	const m = re.exec(sentence);
	if (!m || m.index === undefined) return null;
	return { start: m.index, end: m.index + m[0].length };
}

function truncateContextSnippet(text: string, max = 140): string {
	const t = text.replace(/\s+/g, " ").trim();
	if (t.length <= max) return t;
	return `${t.slice(0, max - 1)}…`;
}

function transcriptSpanForUserQuote(
	userMessages: Array<{ id: string; content: string }>,
	quote: string,
): ConversationReviewTranscriptSpan | undefined {
	const messageId = findMessageIdForText(userMessages, quote);
	if (!messageId) return undefined;
	const message = userMessages.find((m) => m.id === messageId);
	if (!message) return undefined;
	const span = findUtf16SpanInText(message.content, quote);
	if (!span) return undefined;
	return { messageId, start: span.start, end: span.end };
}

function normalizeGrammarPracticeVariant(
	raw: string | undefined,
): ConversationReviewPracticeVariant {
	if (raw === "question-transform" || raw === "fill-blank") return raw;
	return "repeat";
}

function normalizeVocabularyPracticeVariant(
	taskType: "swap-word" | "rephrase",
	raw: string | undefined,
): ConversationReviewPracticeVariant {
	if (raw === "choose-option" || raw === "personalize") return raw;
	if (taskType === "rephrase") return "repeat";
	return "repeat";
}

function articulationTipForPronunciation(
	errorType: string,
	soundLabel: string,
): string | undefined {
	if (errorType === "Omission") {
		return "Try to finish the word clearly — the last sound was weak or missing.";
	}
	if (errorType === "Mispronunciation") {
		return `Focus on ${soundLabel}. Listen to the model, then match the mouth shape slowly.`;
	}
	if (errorType === "UnexpectedBreak" || errorType === "MissingBreak") {
		return "Keep the word flowing as one unit — avoid an awkward pause in the middle.";
	}
	if (errorType === "Monotone") {
		return "Add a little stress on the key syllable so the word pops.";
	}
	return undefined;
}

function pronunciationExplanation(
	word: string,
	soundLabel: string,
	errorType: string,
	score: number,
): string {
	const rounded = Math.round(score);
	if (errorType && errorType !== "None") {
		const human = errorType.replace(/([A-Z])/g, " $1").trim();
		return `We flagged “${word}” (${human}, ~${rounded}%). Drill ${soundLabel} in your original sentence.`;
	}
	return `“${word}” scored around ${rounded}%. Practice ${soundLabel} in context.`;
}

function phonemeIndexToHighlight(
	word: string,
	phonemeIndex: number,
	phonemeCount: number,
): number {
	const w = word.normalize("NFC");
	if (!w.length) return 0;
	const n = Math.max(1, phonemeCount);
	const idx = Math.min(Math.max(0, phonemeIndex), n - 1);
	const segment = w.length / n;
	return Math.min(Math.floor(idx * segment + segment / 2), w.length - 1);
}

/** Map Azure phoneme timings (utterance-relative ticks) to UTF-16 indices inside `refWord`. */
function weakSoundHighlightRange(
	refWord: string,
	w: WordResult,
	weakestPhonemeIndex: number,
): { start: number; end: number } {
	const text = refWord.normalize("NFC");
	const len = text.length;
	if (len === 0) return { start: 0, end: 0 };

	const phonemeList = w.phonemes ?? [];
	const p = phonemeList[weakestPhonemeIndex];
	const wOff = w.offset;
	const wDur = w.duration;

	if (
		p &&
		typeof p.offset === "number" &&
		typeof p.duration === "number" &&
		typeof wOff === "number" &&
		typeof wDur === "number" &&
		wDur > 0
	) {
		const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
		const rel0 = clamp01((p.offset - wOff) / wDur);
		const rel1 = clamp01((p.offset - wOff + p.duration) / wDur);
		let i0 = Math.floor(rel0 * len);
		let i1 = Math.ceil(rel1 * len) - 1;
		if (i1 < i0) i1 = i0;
		i0 = Math.min(Math.max(0, i0), len - 1);
		i1 = Math.min(Math.max(i0, i1), len - 1);
		return { start: i0, end: i1 };
	}

	const n = Math.max(1, phonemeList.length);
	const idx = phonemeIndexToHighlight(refWord, weakestPhonemeIndex, n);
	return { start: idx, end: idx };
}

function pronunciationSoundLabel(weakPhonemeSymbol: string): string {
	const s = weakPhonemeSymbol.trim();
	if (!s) return "Weak sound";
	return s.startsWith("/") && s.endsWith("/")
		? `Sound ${s}`
		: `Sound /${s.replace(/^\/|\/$/g, "")}/`;
}

function estimatedScoreFromProblems(
	problems: Array<{ severity: ConversationReviewProblem["severity"] }>,
): number {
	if (problems.length === 0) return 98;

	const severityPenalty = {
		high: 14,
		medium: 8,
		low: 4,
	} as const;
	const diminishingFactor = [1, 0.75, 0.55, 0.4] as const;
	const sorted = [...problems].sort((a, b) => {
		const rank = { high: 0, medium: 1, low: 2 } as const;
		return rank[a.severity] - rank[b.severity];
	});

	const penalty = sorted.reduce((sum, problem, index) => {
		const factor =
			diminishingFactor[index as 0 | 1 | 2 | 3] ?? (index < 8 ? 0.3 : 0.18);
		return sum + severityPenalty[problem.severity] * factor;
	}, 0);

	return Math.max(72, Math.min(98, Math.round(100 - penalty)));
}

function resolvedCategoryScore(
	rawScore: number | null | undefined,
	problems: Array<{ severity: ConversationReviewProblem["severity"] }>,
): number {
	const heuristic = estimatedScoreFromProblems(problems);
	if (typeof rawScore !== "number" || Number.isNaN(rawScore)) {
		return heuristic;
	}
	return Math.max(Math.round(rawScore), heuristic);
}

function buildPronunciationReview(
	results: Array<
		PronunciationAssessmentResult & {
			messageId: string;
			referenceText: string;
		}
	>,
): {
	problems: ConversationReviewProblem[];
	tasks: ConversationReviewTask[];
} {
	type Candidate = WordResult & { messageId: string; referenceText: string };

	const candidates: Candidate[] = results
		.flatMap((result) =>
			result.words.map((word) => ({
				...word,
				messageId: result.messageId,
				referenceText: result.referenceText,
			})),
		)
		.filter(
			(word) =>
				Boolean(word.word) &&
				(word.errorType !== "None" || word.accuracyScore < 78),
		)
		.sort((a, b) => a.accuracyScore - b.accuracyScore);

	const seen = new Set<string>();
	const selected: Candidate[] = [];
	for (const c of candidates) {
		const key = c.word.trim().toLowerCase();
		if (!key || seen.has(key)) continue;
		seen.add(key);
		selected.push(c);
	}

	const problems: ConversationReviewProblem[] = [];
	const tasks: ConversationReviewTask[] = [];

	if (selected.length === 0) {
		return { problems, tasks };
	}

	type Analyzed = {
		w: Candidate;
		phonemeKey: string;
		weakSymbol: string;
		displayLabel: string;
		highlightIndex: number;
		highlightEndIndex: number;
		transcriptSpan: ConversationReviewTranscriptSpan | undefined;
		targetScore: number;
	};

	const analyzed: Analyzed[] = selected.map((w) => {
		const phonemes = w.phonemes?.length ? w.phonemes : [];
		let weakestIdx = 0;
		if (phonemes.length > 0) {
			weakestIdx = phonemes.reduce((bestIdx, p, i, arr) => {
				const prev = arr[bestIdx];
				if (!prev) return i;
				return p.accuracyScore < prev.accuracyScore ? i : bestIdx;
			}, 0);
		}
		const weakSymbol = phonemes[weakestIdx]?.phoneme?.trim() ?? "";
		const phonemeKey =
			weakSymbol.toLowerCase() ||
			(w.errorType !== "None"
				? `err:${w.errorType}`.toLowerCase()
				: "weak-word");
		const { start: highlightIndex, end: highlightEndIndex } =
			weakSoundHighlightRange(w.word, w, weakestIdx);
		const displayLabel = weakSymbol
			? pronunciationSoundLabel(weakSymbol)
			: "Weak sound";
		const wordSpan = findWordUtf16Span(w.referenceText, w.word);
		const transcriptSpan: ConversationReviewTranscriptSpan | undefined =
			wordSpan
				? {
						messageId: w.messageId,
						start: wordSpan.start,
						end: wordSpan.end,
					}
				: undefined;
		const targetScore = w.accuracyScore < 55 ? 75 : 85;
		return {
			w,
			phonemeKey,
			weakSymbol,
			displayLabel,
			highlightIndex,
			highlightEndIndex,
			transcriptSpan,
			targetScore,
		};
	});

	const byPhoneme = new Map<string, Analyzed[]>();
	for (const a of analyzed) {
		const list = byPhoneme.get(a.phonemeKey) ?? [];
		list.push(a);
		byPhoneme.set(a.phonemeKey, list);
	}

	const groupKeys = [...byPhoneme.keys()].sort((ka, kb) => {
		const minScore = (key: string) => {
			const arr = byPhoneme.get(key);
			if (!arr?.length) return 0;
			return Math.min(...arr.map((x) => x.w.accuracyScore));
		};
		return minScore(ka) - minScore(kb);
	});

	for (const phonemeKey of groupKeys) {
		const items = byPhoneme.get(phonemeKey);
		if (!items?.length) continue;
		items.sort((a, b) => a.w.accuracyScore - b.w.accuracyScore);
		const first = items[0];
		if (!first) continue;
		const displayLabel = first.displayLabel;
		const primary = first.w;
		const worstAccuracy = Math.min(...items.map((i) => i.w.accuracyScore));
		const severity: ConversationReviewProblem["severity"] =
			worstAccuracy < 45 ? "high" : worstAccuracy < 65 ? "medium" : "low";
		const targetScoreRounded = Math.round(
			Math.min(...items.map((i) => i.targetScore)),
		);
		const problemId = crypto.randomUUID();
		const tip =
			items.length === 1
				? articulationTipForPronunciation(
						primary.errorType,
						first.weakSymbol ? displayLabel : "the marked sound",
					)
				: `Drill ${displayLabel} in each word below — listen, then match the model.`;

		problems.push({
			id: problemId,
			type: "pronunciation",
			title:
				items.length === 1
					? `Practice: ${primary.word}`
					: `${displayLabel} — ${items.length} words`,
			sourceText: primary.referenceText,
			suggestedText: primary.word,
			skillSubtype: displayLabel,
			explanation:
				items.length === 1
					? pronunciationExplanation(
							primary.word,
							displayLabel,
							primary.errorType,
							primary.accuracyScore,
						)
					: `We grouped ${items.length} words that need work on ${displayLabel}. Example: “${primary.word}”.`,
			severity,
			messageId: primary.messageId,
			contextSnippet: truncateContextSnippet(primary.referenceText),
			transcriptSpan: first.transcriptSpan,
			articulationTip: tip,
			pronunciationTargets: items.map((item) => ({
				text: item.w.word,
				score: item.w.accuracyScore,
				errorType: item.w.errorType,
				messageId: item.w.messageId,
				sentenceContext: item.w.referenceText,
				soundLabel: displayLabel,
				highlightIndex: item.highlightIndex,
				...(item.highlightEndIndex !== item.highlightIndex
					? { highlightEndIndex: item.highlightEndIndex }
					: {}),
				...(item.transcriptSpan ? { transcriptSpan: item.transcriptSpan } : {}),
			})),
		});

		tasks.push({
			id: crypto.randomUUID(),
			problemId,
			type: "pronunciation",
			taskType: "pronunciation-drill",
			prompt:
				items.length === 1
					? `Repeat “${primary.word}” clearly. Aim for ${targetScoreRounded}+.`
					: `Practice these words for ${displayLabel}. Aim for ${targetScoreRounded}+ on each.`,
			payload: {
				phonemeGroups: [
					{
						phoneme: phonemeKey,
						displayLabel,
						words: items.map((item) => ({
							word: item.w.word,
							score: Math.round(item.w.accuracyScore),
							highlightIndex: item.highlightIndex,
							...(item.highlightEndIndex !== item.highlightIndex
								? { highlightEndIndex: item.highlightEndIndex }
								: {}),
						})),
					},
				],
				practiceText: primary.word,
				pronunciationTarget: primary.word,
				targetScore: targetScoreRounded,
				hint:
					tip ??
					"Listen to the model, then record yourself on the selected word.",
			},
		});
	}

	return { problems, tasks };
}

export async function generateConversationFeedback(
	sessionId: string,
	userId: string,
): Promise<{ sessionId: string }> {
	console.log(
		`[feedback] Starting feedback generation for session ${sessionId}`,
	);

	const now = new Date();

	try {
		const session = await db
			.select()
			.from(conversationSession)
			.where(eq(conversationSession.id, sessionId))
			.limit(1);

		if (!session[0] || session[0].userId !== userId) {
			throw new Error("Session not found or unauthorized");
		}

		const messages = await db
			.select()
			.from(conversationMessage)
			.where(eq(conversationMessage.sessionId, sessionId))
			.orderBy(conversationMessage.createdAt);

		const userMessages = messages.filter(
			(message): message is typeof message & { role: "user" } =>
				message.role === "user",
		);
		const voiceMessageIds = new Set(
			userMessages
				.filter(
					(message) =>
						Boolean(message.audioUrl) ||
						message.metadata?.transcribedFrom === "voice",
				)
				.map((message) => message.id),
		);
		const conversationTurns = buildConversationTurns(messages);

		if (userMessages.length < MIN_USER_MESSAGES) {
			await db
				.update(conversationSession)
				.set({
					reviewStatus: "completed",
					reviewGeneratedAt: now,
					review: emptyReview("not_enough_messages"),
					updatedAt: now,
				})
				.where(eq(conversationSession.id, sessionId));

			return { sessionId };
		}

		const voiceMessages = userMessages
			.filter((message): message is typeof message & { audioUrl: string } =>
				Boolean(message.audioUrl),
			)
			.map((message) => ({
				id: message.id,
				content: message.content,
				audioUrl: message.audioUrl,
			}));

		const level = session[0].level ?? "beginner";
		const sessionMeta = getConversationSessionMeta(session[0]);
		const reviewGuidance = buildConversationReviewGuidance(sessionMeta);
		const [pronunciationResult, aiAnalysis] = await Promise.all([
			voiceMessages.length > 0
				? assessVoiceMessages(voiceMessages)
				: Promise.resolve({ pronunciationScore: null, results: [] }),
			analyzeWithAI(conversationTurns, level, reviewGuidance),
		]);
		const classifiedAnalysis = splitAndClassifyReviewAnalysis(
			aiAnalysis,
			userMessages,
			voiceMessageIds,
		);

		const grammarProblems: ConversationReviewProblem[] = [];
		const vocabularyProblems: ConversationReviewProblem[] = [];
		const tasks: ConversationReviewTask[] = [];

		for (const item of classifiedAnalysis.grammarProblems) {
			const messageId =
				findMessageIdForText(userMessages, item.sourceText) ?? undefined;
			const problemId = crypto.randomUUID();
			const practiceVariant = normalizeGrammarPracticeVariant(
				item.practiceVariant,
			);
			grammarProblems.push({
				id: problemId,
				type: "grammar",
				title: "Fix this sentence",
				sourceText: item.sourceText,
				suggestedText: item.suggestedText,
				explanation: item.explanation,
				severity: item.severity,
				skillSubtype: normalizeGrammarSubtype(
					item.subtype,
					item.sourceText,
					item.suggestedText,
					item.explanation,
				),
				inlineSegments: normalizeInlineSegments(
					item.inlineSegments,
					item.sourceText,
					item.suggestedText,
				),
				messageId,
				transcriptSpan: transcriptSpanForUserQuote(
					userMessages,
					item.sourceText,
				),
				contextSnippet: truncateContextSnippet(item.sourceText),
				practiceVariant,
			});
			tasks.push({
				id: crypto.randomUUID(),
				problemId,
				type: "grammar",
				taskType: "repeat-correction",
				prompt: "Say the corrected sentence once.",
				payload: {
					sourceText: item.sourceText,
					suggestedText: item.suggestedText,
					practiceText: item.suggestedText,
					phraseToSave: item.suggestedText,
				},
			});
		}

		for (const item of classifiedAnalysis.vocabularyProblems) {
			const messageId =
				findMessageIdForText(userMessages, item.sourceText) ?? undefined;
			const problemId = crypto.randomUUID();
			const defaultVocabSubtype =
				item.taskType === "swap-word"
					? "Choose a different word"
					: "Rephrase the idea";
			const practiceVariant = normalizeVocabularyPracticeVariant(
				item.taskType,
				item.practiceVariant,
			);
			const alternatives = (item.alternatives ?? [])
				.map((a) => a.trim())
				.filter(
					(a) =>
						a.length > 0 &&
						a.toLowerCase() !== item.suggestedText.trim().toLowerCase(),
				)
				.slice(0, 2);
			vocabularyProblems.push({
				id: problemId,
				type: "vocabulary",
				title:
					item.taskType === "swap-word"
						? "Choose a stronger word"
						: "Rephrase this idea",
				sourceText: item.sourceText,
				suggestedText: item.suggestedText,
				explanation: item.explanation,
				severity: item.severity,
				skillSubtype: item.subtype?.trim() || defaultVocabSubtype,
				inlineSegments: normalizeInlineSegments(
					item.inlineSegments,
					item.sourceText,
					item.suggestedText,
				),
				messageId,
				vocabularyItems: item.vocabularyItems ?? [],
				transcriptSpan: transcriptSpanForUserQuote(
					userMessages,
					item.sourceText,
				),
				contextSnippet: truncateContextSnippet(item.sourceText),
				practiceVariant,
				alternatives: alternatives.length > 0 ? alternatives : undefined,
			});
			tasks.push({
				id: crypto.randomUUID(),
				problemId,
				type: "vocabulary",
				taskType: item.taskType,
				prompt:
					item.taskType === "swap-word"
						? "Use the stronger wording once."
						: "Say the improved sentence once.",
				payload: {
					sourceText: item.sourceText,
					suggestedText: item.suggestedText,
					practiceText: item.suggestedText,
					vocabularyItems: item.vocabularyItems ?? [],
					phraseToSave: item.suggestedText,
				},
			});
		}

		const pronunciationReview = buildPronunciationReview(
			pronunciationResult.results,
		);
		const problems = [
			...grammarProblems,
			...vocabularyProblems,
			...pronunciationReview.problems,
		];
		tasks.push(...pronunciationReview.tasks);

		const resolvedGrammarScore = resolvedCategoryScore(
			aiAnalysis.grammarScore,
			grammarProblems,
		);
		const resolvedVocabularyScore = resolvedCategoryScore(
			aiAnalysis.vocabularyScore,
			vocabularyProblems,
		);

		const scores = [
			resolvedGrammarScore,
			resolvedVocabularyScore,
			pronunciationResult.pronunciationScore,
		].filter((value): value is number => value != null);

		const review: ConversationReview = {
			availability: "ready",
			overallScore:
				scores.length > 0
					? Math.round(
							scores.reduce((total, score) => total + score, 0) / scores.length,
						)
					: null,
			scores: {
				grammar: resolvedGrammarScore,
				vocabulary: resolvedVocabularyScore,
				pronunciation: pronunciationResult.pronunciationScore,
			},
			problems,
			tasks,
			stats: {
				totalProblems: problems.length,
				totalTasks: tasks.length,
			},
		};

		await db
			.update(conversationSession)
			.set({
				reviewStatus: "completed",
				reviewGeneratedAt: now,
				review,
				updatedAt: now,
			})
			.where(eq(conversationSession.id, sessionId));

		console.log(
			`[feedback] Review completed for session ${sessionId} — overall=${review.overallScore ?? "n/a"}`,
		);

		return { sessionId };
	} catch (error) {
		await db
			.update(conversationSession)
			.set({
				reviewStatus: "failed",
				updatedAt: now,
			})
			.where(eq(conversationSession.id, sessionId));

		throw error;
	}
}
