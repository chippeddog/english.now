import { createOpenAI } from "@ai-sdk/openai";
import type {
	PronunciationSessionSummary,
	ReadAloudItem,
	TongueTwisterItem,
	WeakPhoneme,
	WordResult,
} from "@english.now/db";
import {
	and,
	db,
	desc,
	eq,
	isNull,
	pronunciationAttempt,
	pronunciationSession,
	userProfile,
} from "@english.now/db";
import { env } from "@english.now/env/server";
import { generateText, Output } from "ai";
import { z } from "zod";
import { protectedProcedure, router } from "../index";

const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });

const readAloudSchema = z.object({
	items: z.array(
		z.object({
			text: z.string(),
			topic: z.string(),
			phonemeFocus: z.string(),
			tips: z.string(),
		}),
	),
});

const tongueTwisterSchema = z.object({
	items: z.array(
		z.object({
			text: z.string(),
			speed: z.enum(["slow", "medium", "fast"]),
			targetPhonemes: z.array(z.string()),
			tip: z.string(),
		}),
	),
});

// ─── AI Content Generation ────────────────────────────────────────────────────
async function generateReadAloudItems(
	level: string,
	interests?: string[],
	count = 5,
): Promise<ReadAloudItem[]> {
	const interestContext =
		interests && interests.length > 0
			? `The learner is interested in: ${interests.join(", ")}. Try to incorporate these topics naturally.`
			: "Use a variety of everyday topics.";

	const levelGuidance: Record<string, string> = {
		beginner:
			"Use simple, short sentences (5-10 words). Common vocabulary only. Simple present and past tense.",
		intermediate:
			"Use moderate sentences (10-20 words). Include some compound sentences. Mix of tenses and some phrasal verbs.",
		advanced:
			"Use complex sentences (15-30 words). Include subordinate clauses, advanced vocabulary, and varied intonation patterns.",
	};

	const { output } = await generateText({
		model: openai("gpt-4o-mini"),
		output: Output.object({ schema: readAloudSchema }),
		system: `You are an expert English pronunciation coach. Generate practice texts for reading aloud.

Each item should:
- Be a single sentence or short passage appropriate for reading aloud
- Focus on a specific pronunciation challenge (a phoneme, stress pattern, or intonation pattern)
- Include a practical tip for pronouncing it well

Level guidance: ${levelGuidance[level] || levelGuidance.intermediate}

${interestContext}

Generate exactly ${count} items. Make each one focus on a different pronunciation aspect.`,
		prompt: `Generate ${count} English read-aloud practice sentences for a ${level} level learner. Each should target different pronunciation challenges like vowel sounds, consonant clusters, word stress, sentence rhythm, or linking sounds.`,
		temperature: 0.8,
	});

	if (!output) throw new Error("Failed to generate read aloud content");
	return output.items;
}

async function generateTongueTwisterItems(
	level: string,
	focusPhonemes?: string[],
	count = 5,
): Promise<TongueTwisterItem[]> {
	const phonemeContext =
		focusPhonemes && focusPhonemes.length > 0
			? `Focus especially on these phonemes the learner struggles with: ${focusPhonemes.join(", ")}.`
			: "Cover a variety of challenging English phonemes.";

	const levelGuidance: Record<string, string> = {
		beginner:
			"Short tongue twisters (4-8 words). Repeat simple sound patterns. Mark all as 'slow' speed.",
		intermediate:
			"Medium tongue twisters (8-15 words). More complex sound combinations. Mix of 'slow' and 'medium' speeds.",
		advanced:
			"Long and complex tongue twisters (10-20 words). Intricate sound patterns. Mix of 'medium' and 'fast' speeds.",
	};

	const { output } = await generateText({
		model: openai("gpt-4o-mini"),
		output: Output.object({ schema: tongueTwisterSchema }),
		system: `You are an expert English pronunciation coach specializing in tongue twisters.

Generate creative, fun tongue twisters that target specific pronunciation challenges.

Each item should:
- Be a tongue twister that challenges specific phonemes
- Include the target phonemes being practiced
- Include a tip for mastering it
- Have an appropriate speed rating based on difficulty

Level guidance: ${levelGuidance[level] || levelGuidance.intermediate}

${phonemeContext}

Generate exactly ${count} items. Mix classic-style tongue twisters with original ones. Make them fun and memorable.`,
		prompt: `Generate ${count} tongue twisters for a ${level} level English learner. Each should target different sound combinations.`,
		temperature: 0.9,
	});

	if (!output) throw new Error("Failed to generate tongue twister content");
	return output.items;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapLevelToDifficulty(
	level: string | null | undefined,
): "beginner" | "intermediate" | "advanced" {
	switch (level) {
		case "beginner":
		case "elementary":
			return "beginner";
		case "upper-intermediate":
		case "advanced":
			return "advanced";
		default:
			return "intermediate";
	}
}

export const pronunciationRouter = router({
	startSession: protectedProcedure
		.input(
			z.object({
				mode: z.enum(["read-aloud", "tongue-twisters"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [profile] = await db
				.select()
				.from(userProfile)
				.where(eq(userProfile.userId, userId))
				.limit(1);

			const difficulty = mapLevelToDifficulty(profile?.level);

			let items: ReadAloudItem[] | TongueTwisterItem[];

			if (input.mode === "read-aloud") {
				items = await generateReadAloudItems(
					difficulty,
					profile?.interests ?? undefined,
				);
			} else {
				items = await generateTongueTwisterItems(difficulty);
			}

			const sessionId = crypto.randomUUID();

			await db.insert(pronunciationSession).values({
				id: sessionId,
				userId,
				mode: input.mode,
				difficulty,
				items,
				status: "active",
			});

			return { sessionId, items };
		}),

	// Submit an attempt with Azure pronunciation assessment data
	submitAttempt: protectedProcedure
		.input(
			z.object({
				sessionId: z.string(),
				itemIndex: z.number().int().min(0),
				transcript: z.string(),
				accuracyScore: z.number(),
				fluencyScore: z.number(),
				completenessScore: z.number(),
				prosodyScore: z.number(),
				pronunciationScore: z.number(),
				words: z.array(
					z.object({
						word: z.string(),
						accuracyScore: z.number(),
						errorType: z.string(),
						phonemes: z.array(
							z.object({
								phoneme: z.string(),
								accuracyScore: z.number(),
							}),
						),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			// Verify session belongs to user
			const [session] = await db
				.select()
				.from(pronunciationSession)
				.where(
					and(
						eq(pronunciationSession.id, input.sessionId),
						eq(pronunciationSession.userId, userId),
					),
				)
				.limit(1);

			if (!session) {
				throw new Error("Session not found");
			}

			// Get the expected text from the session items
			const items = session.items as (ReadAloudItem | TongueTwisterItem)[];
			const item = items[input.itemIndex];
			if (!item) {
				throw new Error("Invalid item index");
			}

			// Use pronunciation score as overall score
			const score = Math.round(input.pronunciationScore);

			// Map words to WordResult format
			const wordResults: WordResult[] = input.words.map((w) => ({
				word: w.word,
				correct: w.errorType === "None",
				accuracyScore: w.accuracyScore,
				errorType: w.errorType as WordResult["errorType"],
				phonemes: w.phonemes,
			}));

			const attemptId = crypto.randomUUID();

			await db.insert(pronunciationAttempt).values({
				id: attemptId,
				sessionId: input.sessionId,
				itemIndex: input.itemIndex,
				transcript: input.transcript,
				score,
				accuracyScore: Math.round(input.accuracyScore),
				fluencyScore: Math.round(input.fluencyScore),
				completenessScore: Math.round(input.completenessScore),
				prosodyScore: Math.round(input.prosodyScore),
				wordResults,
			});

			return {
				attemptId,
				score,
				accuracyScore: input.accuracyScore,
				fluencyScore: input.fluencyScore,
				completenessScore: input.completenessScore,
				prosodyScore: input.prosodyScore,
				words: wordResults,
			};
		}),

	// Complete a session and generate summary with phoneme analysis
	completeSession: protectedProcedure
		.input(z.object({ sessionId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			// Verify session belongs to user
			const [session] = await db
				.select()
				.from(pronunciationSession)
				.where(
					and(
						eq(pronunciationSession.id, input.sessionId),
						eq(pronunciationSession.userId, userId),
					),
				)
				.limit(1);

			if (!session) {
				throw new Error("Session not found");
			}

			// Get all attempts for this session
			const attempts = await db
				.select()
				.from(pronunciationAttempt)
				.where(eq(pronunciationAttempt.sessionId, input.sessionId));

			if (attempts.length === 0) {
				throw new Error("No attempts found for this session");
			}

			// Calculate overall score averages
			const scores = attempts.map((a) => a.score);
			const averageScore = Math.round(
				scores.reduce((sum, s) => sum + s, 0) / scores.length,
			);
			const bestScore = Math.max(...scores);
			const worstScore = Math.min(...scores);

			// Calculate multi-score averages
			const accuracyScores = attempts
				.map((a) => a.accuracyScore)
				.filter((s): s is number => s != null);
			const fluencyScores = attempts
				.map((a) => a.fluencyScore)
				.filter((s): s is number => s != null);
			const prosodyScores = attempts
				.map((a) => a.prosodyScore)
				.filter((s): s is number => s != null);
			const completenessScores = attempts
				.map((a) => a.completenessScore)
				.filter((s): s is number => s != null);

			const avg = (arr: number[]) =>
				arr.length > 0
					? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length)
					: 0;

			const averageAccuracy = avg(accuracyScores);
			const averageFluency = avg(fluencyScores);
			const averageProsody = avg(prosodyScores);
			const averageCompleteness = avg(completenessScores);

			// Find weak words
			const wordCounts = new Map<string, { correct: number; total: number }>();
			// Aggregate phoneme scores across all attempts
			const phonemeMap = new Map<
				string,
				{ totalScore: number; count: number; exampleWords: Set<string> }
			>();

			for (const attempt of attempts) {
				const results = attempt.wordResults as WordResult[];
				for (const r of results) {
					// Weak words tracking
					const existing = wordCounts.get(r.word) || {
						correct: 0,
						total: 0,
					};
					existing.total++;
					if (r.correct) existing.correct++;
					wordCounts.set(r.word, existing);

					// Phoneme tracking
					if (r.phonemes) {
						for (const p of r.phonemes) {
							const entry = phonemeMap.get(p.phoneme) || {
								totalScore: 0,
								count: 0,
								exampleWords: new Set<string>(),
							};
							entry.totalScore += p.accuracyScore;
							entry.count++;
							if (p.accuracyScore < 80) {
								entry.exampleWords.add(r.word);
							}
							phonemeMap.set(p.phoneme, entry);
						}
					}
				}
			}

			const weakWords: string[] = [];
			for (const [word, counts] of wordCounts) {
				if (counts.total > 0 && counts.correct / counts.total < 0.5) {
					weakWords.push(word);
				}
			}

			// Identify weak phonemes (average score < 80)
			const weakPhonemes: WeakPhoneme[] = [];
			for (const [phoneme, data] of phonemeMap) {
				const avgScore = Math.round(data.totalScore / data.count);
				if (avgScore < 80) {
					weakPhonemes.push({
						phoneme,
						score: avgScore,
						occurrences: data.count,
						exampleWords: Array.from(data.exampleWords).slice(0, 5),
					});
				}
			}
			weakPhonemes.sort((a, b) => a.score - b.score);

			// Calculate per-item scores
			const itemScoreMap = new Map<
				number,
				{ bestScore: number; attempts: number }
			>();
			for (const attempt of attempts) {
				const existing = itemScoreMap.get(attempt.itemIndex);
				if (!existing) {
					itemScoreMap.set(attempt.itemIndex, {
						bestScore: attempt.score,
						attempts: 1,
					});
				} else {
					existing.bestScore = Math.max(existing.bestScore, attempt.score);
					existing.attempts++;
				}
			}

			const itemScores = Array.from(itemScoreMap.entries()).map(
				([itemIndex, data]) => ({
					itemIndex,
					bestScore: data.bestScore,
					attempts: data.attempts,
				}),
			);

			const summary: PronunciationSessionSummary = {
				averageScore,
				averageAccuracy,
				averageFluency,
				averageProsody,
				averageCompleteness,
				totalAttempts: attempts.length,
				bestScore,
				worstScore,
				weakWords,
				weakPhonemes,
				itemScores,
			};

			// Update session
			await db
				.update(pronunciationSession)
				.set({
					status: "completed",
					summary,
					completedAt: new Date(),
				})
				.where(eq(pronunciationSession.id, input.sessionId));

			return summary;
		}),

	// Get a specific session with its attempts
	getSession: protectedProcedure
		.input(z.object({ sessionId: z.string() }))
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [session] = await db
				.select()
				.from(pronunciationSession)
				.where(
					and(
						eq(pronunciationSession.id, input.sessionId),
						eq(pronunciationSession.userId, userId),
					),
				)
				.limit(1);

			if (!session) {
				throw new Error("Session not found");
			}

			const attempts = await db
				.select()
				.from(pronunciationAttempt)
				.where(eq(pronunciationAttempt.sessionId, input.sessionId));

			return { ...session, attempts };
		}),

	// Get recent session history
	getHistory: protectedProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(50).default(10),
			}),
		)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const limit = input.limit;

			const sessions = await db
				.select({
					id: pronunciationSession.id,
					mode: pronunciationSession.mode,
					difficulty: pronunciationSession.difficulty,
					status: pronunciationSession.status,
					summary: pronunciationSession.summary,
					createdAt: pronunciationSession.createdAt,
					completedAt: pronunciationSession.completedAt,
				})
				.from(pronunciationSession)
				.where(
					and(
						eq(pronunciationSession.userId, userId),
						isNull(pronunciationSession.deletedAt),
					),
				)
				.orderBy(desc(pronunciationSession.createdAt))
				.limit(limit);

			return sessions;
		}),
});
