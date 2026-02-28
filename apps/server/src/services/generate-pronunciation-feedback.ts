import type {
	CefrLevel,
	ParagraphItem,
	PronunciationFeedback,
	PronunciationSessionSummary,
	WordResult,
} from "@english.now/db";
import {
	db,
	eq,
	pronunciationAttempt,
	pronunciationSession,
} from "@english.now/db";
import { generateText, Output } from "ai";
import { z } from "zod";
import { openai } from "../utils/ai";

const feedbackSchema = z.object({
	mistakePatterns: z
		.array(
			z.object({
				type: z.enum([
					"phoneme",
					"word_stress",
					"omission",
					"mispronunciation",
					"fluency",
				]),
				sound: z
					.string()
					.describe("Target phoneme in IPA, e.g. /θ/, /ɪ/. Empty string if not applicable"),
				description: z
					.string()
					.describe("Brief pattern label, e.g. 'Difficulty with th sounds'"),
				words: z
					.array(z.string())
					.describe("Words from the session where this error occurred"),
				practiceWords: z
					.array(z.string())
					.describe("5-8 additional words to drill this same pattern"),
				priority: z.enum(["high", "medium", "low"]),
			}),
		)
		.describe(
			"2-5 distinct mistake patterns found in the session, ordered by priority",
		),
	exercises: z
		.array(
			z.object({
				type: z.enum([
					"repeat_after",
					"minimal_pairs",
					"tongue_twister",
					"word_chain",
					"sentence_practice",
				]),
				title: z.string().describe("Short exercise title"),
				instruction: z
					.string()
					.describe("One sentence telling the learner what to do"),
				items: z
					.array(z.string())
					.describe("4-8 words, word pairs, or sentences for the exercise"),
				targetSkill: z
					.string()
					.describe("What skill this drills, e.g. '/θ/ vs /s/ distinction'"),
			}),
		)
		.describe("2-4 mini practice exercises the learner can do right away"),
	weakAreas: z
		.array(
			z.object({
				category: z.enum([
					"vowels",
					"consonants",
					"word_stress",
					"rhythm",
					"intonation",
					"linking",
				]),
				severity: z.enum(["high", "medium", "low"]),
				sounds: z
					.array(z.string())
					.describe("Specific sounds affected, in IPA"),
				description: z
					.string()
					.describe("One sentence describing the weakness"),
			}),
		)
		.describe("1-4 categorized weak areas"),
	practiceWordSets: z
		.array(
			z.object({
				word: z.string().describe("The word the learner struggled with"),
				issue: z
					.string()
					.describe("Brief issue label, e.g. 'omitted final consonant'"),
				relatedWords: z
					.array(z.string())
					.describe("3-5 words with the same sound pattern to practice"),
			}),
		)
		.describe("3-8 word sets built from the learner's actual mistakes"),
});

export async function generatePronunciationFeedback(
	sessionId: string,
	userId: string,
): Promise<{ feedbackId: string }> {
	console.log(`[pronunciation-feedback] starting for session ${sessionId}`);

	await db
		.update(pronunciationSession)
		.set({ feedbackStatus: "processing" })
		.where(eq(pronunciationSession.id, sessionId));

	try {
		const [session] = await db
			.select()
			.from(pronunciationSession)
			.where(eq(pronunciationSession.id, sessionId))
			.limit(1);

		if (!session || session.userId !== userId) {
			throw new Error("Session not found or unauthorized");
		}

		const attempts = await db
			.select()
			.from(pronunciationAttempt)
			.where(eq(pronunciationAttempt.sessionId, sessionId));

		if (attempts.length === 0) {
			throw new Error("No attempts found");
		}

		const paragraph = session.paragraph as ParagraphItem | null;
		const summary = session.summary as PronunciationSessionSummary | null;
		const cefrLevel = (session.level ?? "A2") as CefrLevel;

		const allWords: WordResult[] = [];
		for (const attempt of attempts) {
			allWords.push(...(attempt.wordResults as WordResult[]));
		}

		const weakWordsDetail = allWords
			.filter((w) => w.accuracyScore < 70)
			.map(
				(w) =>
					`"${w.word}" (score: ${Math.round(w.accuracyScore)}, error: ${w.errorType})`,
			)
			.slice(0, 15);

		const weakPhonemeDetail =
			summary?.weakPhonemes
				?.map(
					(p) =>
						`/${p.phoneme}/ (avg score: ${p.score}, in words: ${p.exampleWords.join(", ")})`,
				)
				.slice(0, 10) ?? [];

		const bestAttempt = attempts.reduce((best, a) =>
			a.score > best.score ? a : best,
		);

		const { experimental_output } = await generateText({
			model: openai("gpt-4o-mini"),
			output: Output.object({ schema: feedbackSchema }),
			system: `You are an expert English pronunciation coach. Your job is to analyze a practice session and produce ONLY structured, actionable data that will power mini-lessons and practice exercises in the app.

The learner practiced at CEFR level ${cefrLevel}.

Scoring context:
- Scores are 0-100 from Azure Speech Assessment
- Accuracy: how correctly individual sounds were produced
- Fluency: naturalness of speech rhythm and pacing
- Completeness: how much of the text was actually spoken
- Prosody: intonation, stress patterns, and rhythm

Rules:
- Focus on MISTAKES and WEAK AREAS only. Do not describe strengths or give motivational text.
- Every mistake pattern must include real words from the session AND extra practice words.
- Exercises must be concrete drills the learner can do immediately (minimal pairs, tongue twisters, repeat-after chains, etc.).
- Use IPA notation for sounds where possible.
- practiceWordSets should be built directly from the learner's worst-scoring words, grouping by shared sound pattern.
- Keep descriptions terse — these power UI labels, not paragraphs.`,
			prompt: `Analyze this pronunciation session and extract actionable practice data:

Paragraph practiced (${cefrLevel}): "${paragraph?.text ?? "Unknown"}"
Topic: ${paragraph?.topic ?? "Unknown"}

Performance Summary:
- Overall score: ${summary?.averageScore ?? "N/A"}/100
- Accuracy: ${summary?.averageAccuracy ?? "N/A"}/100
- Fluency: ${summary?.averageFluency ?? "N/A"}/100
- Prosody: ${summary?.averageProsody ?? "N/A"}/100
- Completeness: ${summary?.averageCompleteness ?? "N/A"}/100
- Total attempts: ${summary?.totalAttempts ?? attempts.length}
- Best score: ${summary?.bestScore ?? "N/A"}/100

Best attempt transcript: "${bestAttempt.transcript}"

Problematic words: ${weakWordsDetail.length > 0 ? weakWordsDetail.join("; ") : "None significant"}

Weak phonemes: ${weakPhonemeDetail.length > 0 ? weakPhonemeDetail.join("; ") : "None significant"}

Weak words: ${summary?.weakWords?.join(", ") ?? "None"}`,
			temperature: 0.3,
		});

		if (!experimental_output) {
			throw new Error("AI analysis returned no output");
		}

		const feedback: PronunciationFeedback = experimental_output;

		await db
			.update(pronunciationSession)
			.set({
				feedback,
				feedbackStatus: "completed",
			})
			.where(eq(pronunciationSession.id, sessionId));

		console.log(`[pronunciation-feedback] completed for session ${sessionId}`);

		return { feedbackId: sessionId };
	} catch (err) {
		console.error("[pronunciation-feedback] failed:", err);

		await db
			.update(pronunciationSession)
			.set({ feedbackStatus: "failed" })
			.where(eq(pronunciationSession.id, sessionId));

		throw err;
	}
}
