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
	overallAnalysis: z
		.string()
		.describe("2-3 sentence analysis of the learner's pronunciation performance in this session"),
	strengths: z
		.array(z.string())
		.describe("2-4 specific pronunciation strengths observed"),
	areasToImprove: z
		.array(z.string())
		.describe("2-4 specific areas needing improvement"),
	suggestions: z
		.array(
			z.object({
				type: z.enum(["phoneme", "word", "pattern", "fluency"]),
				title: z.string().describe("Short title for this suggestion"),
				description: z
					.string()
					.describe("Practical advice for improvement"),
				examples: z
					.array(z.string())
					.describe("Example words or phrases to practice"),
				priority: z.enum(["high", "medium", "low"]),
			}),
		)
		.describe("3-6 actionable practice suggestions ranked by priority"),
	recommendedLevel: z
		.enum(["A1", "A2", "B1", "B2"])
		.describe("Recommended CEFR level for next practice based on performance"),
	nextSteps: z
		.string()
		.describe("1-2 sentence motivational guidance for what to focus on next"),
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
		const cefrLevel = (session.cefrLevel ?? "A2") as CefrLevel;

		const allWords: WordResult[] = [];
		for (const attempt of attempts) {
			allWords.push(...(attempt.wordResults as WordResult[]));
		}

		const weakWordsDetail = allWords
			.filter((w) => w.accuracyScore < 70)
			.map((w) => `"${w.word}" (score: ${Math.round(w.accuracyScore)}, error: ${w.errorType})`)
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
			system: `You are an expert English pronunciation coach analyzing a read-aloud practice session.

The learner practiced at CEFR level ${cefrLevel}. Analyze their performance and generate actionable feedback.

Scoring context:
- Scores are 0-100 from Azure Speech Assessment
- Accuracy: how correctly individual sounds were produced
- Fluency: naturalness of speech rhythm and pacing
- Completeness: how much of the text was actually spoken
- Prosody: intonation, stress patterns, and rhythm

Be encouraging but honest. Focus on the most impactful improvements.
Suggestions should be specific and actionable with concrete practice examples.
For recommendedLevel, suggest the same level if score >= 70, one level down if < 50, one level up if >= 90.`,
			prompt: `Analyze this pronunciation practice session:

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
			temperature: 0.4,
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

		console.log(
			`[pronunciation-feedback] completed for session ${sessionId}`,
		);

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
