import { createOpenAI } from "@ai-sdk/openai";
import type {
	CefrLevel,
	ParagraphItem,
	PronunciationSessionSummary,
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
import { protectedProcedure, rateLimitedProcedure, router } from "../index";
import { recordActivity } from "../services/record-activity";

const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });

const CEFR_CONFIG: Record<
	CefrLevel,
	{ wordRange: [number, number]; style: string; description: string }
> = {
	A1: {
		wordRange: [60, 80],
		style:
			"Simple present tense, basic past tense. Common vocabulary only (top 1000 words). Short, simple sentences. Clear pronunciation patterns.",
		description:
			"Everyday topics: daily routine, family, food, weather, greetings",
	},
	A2: {
		wordRange: [80, 100],
		style:
			"Simple narrative with past tense. Common vocabulary with some descriptive adjectives. Compound sentences with 'and', 'but', 'because'. Natural rhythm and intonation patterns.",
		description:
			"Simple narrative: travel stories, hobbies, descriptions of people and places",
	},
	B1: {
		wordRange: [100, 130],
		style:
			"News article style. Some complex structures (relative clauses, conditionals). Mixed tenses including present perfect. Varied intonation and stress patterns.",
		description:
			"News/magazine article style: current events, technology, culture, environment",
	},
	B2: {
		wordRange: [120, 150],
		style:
			"Academic/professional register. Varied syntax (passive voice, complex subordination, reported speech). Sophisticated vocabulary with some idioms. Advanced prosody patterns.",
		description:
			"Academic/professional topics: science, business, abstract concepts, social issues",
	},
	C1: {
		wordRange: [150, 200],
		style:
			"Literary/philosophical style. Complex syntax (nested clauses, coordinate structures). Sophisticated vocabulary with many idioms. Advanced prosody patterns.",
		description:
			"Literary/philosophical topics: literature, philosophy, history, politics",
	},
};

const paragraphSchema = z.object({
	text: z.string(),
	topic: z.string(),
	focusAreas: z.array(z.string()),
	tips: z.string(),
});

async function generateParagraph(
	level: CefrLevel,
	interests?: string[],
): Promise<ParagraphItem> {
	const config = CEFR_CONFIG[level];
	const [minWords, maxWords] = config.wordRange;

	const interestContext =
		interests && interests.length > 0
			? `The learner is interested in: ${interests.join(", ")}. Try to incorporate one of these topics naturally.`
			: "";

	const { output } = await generateText({
		model: openai("gpt-4o-mini"),
		output: Output.object({ schema: paragraphSchema }),
		system: `You are an expert English pronunciation coach creating read-aloud practice paragraphs.

Generate a single coherent paragraph for CEFR level ${level}.

Requirements:
- Word count: ${minWords}-${maxWords} words (STRICT — count carefully)
- Style: ${config.style}
- Topic area: ${config.description}
- The paragraph should flow naturally and be interesting to read aloud
- Include a variety of pronunciation challenges appropriate for the level (vowel sounds, consonant clusters, word stress, linking sounds, intonation patterns)
- The focusAreas should list 2-3 specific pronunciation features present in the paragraph
- The tips should give 1-2 practical pronunciation tips for reading this paragraph well

${interestContext}`,
		prompt: `Generate a read-aloud practice paragraph for CEFR level ${level}. Make it engaging and natural-sounding.`,
		temperature: 0.85,
	});

	if (!output) throw new Error("Failed to generate paragraph");

	const wordCount = output.text.split(/\s+/).length;

	return {
		text: output.text,
		topic: output.topic,
		cefrLevel: level,
		wordCount,
		focusAreas: output.focusAreas,
		tips: output.tips,
	};
}

function profileLevelToCefr(level: string | null | undefined): CefrLevel {
	switch (level) {
		case "beginner":
			return "A1";
		case "elementary":
			return "A2";
		case "intermediate":
			return "B1";
		case "upper-intermediate":
			return "B2";
		case "advanced":
			return "C1";
		default:
			return "A2";
	}
}

export const pronunciationRouter = router({
	startSession: rateLimitedProcedure(5, 60_000)
		.input(
			z.object({
				cefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1"]).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [profile] = await db
				.select()
				.from(userProfile)
				.where(eq(userProfile.userId, userId))
				.limit(1);

			const level = input.cefrLevel ?? profileLevelToCefr(profile?.level);
			const paragraph = await generateParagraph(
				level,
				profile?.interests ?? undefined,
			);

			const sessionId = crypto.randomUUID();

			await recordActivity(userId, "pronunciation");

			await db.insert(pronunciationSession).values({
				id: sessionId,
				userId,
				mode: "read-aloud",
				difficulty: level,
				cefrLevel: level,
				paragraph,
				items: [paragraph],
				status: "active",
			});

			return { sessionId, paragraph, level };
		}),

	submitAttempt: protectedProcedure
		.input(
			z.object({
				sessionId: z.string(),
				itemIndex: z.number().int().min(0).default(0),
				transcript: z.string(),
				audioUrl: z.string().url().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
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

			if (!session) throw new Error("Session not found");

			const attemptId = crypto.randomUUID();

			await db.insert(pronunciationAttempt).values({
				id: attemptId,
				sessionId: input.sessionId,
				itemIndex: input.itemIndex,
				transcript: input.transcript,
				score: 0,
				wordResults: [],
				audioUrl: input.audioUrl,
			});

			return { attemptId };
		}),

	completeSession: protectedProcedure
		.input(z.object({ sessionId: z.string() }))
		.mutation(async ({ ctx, input }) => {
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

			if (!session) throw new Error("Session not found");

			const attempts = await db
				.select()
				.from(pronunciationAttempt)
				.where(eq(pronunciationAttempt.sessionId, input.sessionId));

			if (attempts.length === 0) {
				throw new Error("No attempts found for this session");
			}

			const scores = attempts.map((a) => a.score);
			const avg = (arr: number[]) =>
				arr.length > 0
					? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length)
					: 0;

			const averageScore = avg(scores);
			const bestScore = Math.max(...scores);
			const worstScore = Math.min(...scores);

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

			const wordCounts = new Map<string, { correct: number; total: number }>();
			const phonemeMap = new Map<
				string,
				{ totalScore: number; count: number; exampleWords: Set<string> }
			>();

			for (const attempt of attempts) {
				const results = attempt.wordResults as WordResult[];
				for (const r of results) {
					const existing = wordCounts.get(r.word) || { correct: 0, total: 0 };
					existing.total++;
					if (r.correct) existing.correct++;
					wordCounts.set(r.word, existing);

					if (r.phonemes) {
						for (const p of r.phonemes) {
							const entry = phonemeMap.get(p.phoneme) || {
								totalScore: 0,
								count: 0,
								exampleWords: new Set<string>(),
							};
							entry.totalScore += p.accuracyScore;
							entry.count++;
							if (p.accuracyScore < 80) entry.exampleWords.add(r.word);
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

			const summary: PronunciationSessionSummary = {
				averageScore,
				averageAccuracy: avg(accuracyScores),
				averageFluency: avg(fluencyScores),
				averageProsody: avg(prosodyScores),
				averageCompleteness: avg(completenessScores),
				totalAttempts: attempts.length,
				bestScore,
				worstScore,
				weakWords,
				weakPhonemes,
			};

			await db
				.update(pronunciationSession)
				.set({
					status: "completed",
					summary,
					feedbackStatus: "pending",
					completedAt: new Date(),
				})
				.where(eq(pronunciationSession.id, input.sessionId));

			return { summary, sessionId: input.sessionId };
		}),

	deleteAttempt: protectedProcedure
		.input(z.object({ attemptId: z.string(), sessionId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [session] = await db
				.select({ id: pronunciationSession.id })
				.from(pronunciationSession)
				.where(
					and(
						eq(pronunciationSession.id, input.sessionId),
						eq(pronunciationSession.userId, userId),
						eq(pronunciationSession.status, "active"),
					),
				)
				.limit(1);

			if (!session) throw new Error("Session not found or already completed");

			const [deleted] = await db
				.delete(pronunciationAttempt)
				.where(
					and(
						eq(pronunciationAttempt.id, input.attemptId),
						eq(pronunciationAttempt.sessionId, input.sessionId),
					),
				)
				.returning({ id: pronunciationAttempt.id });

			if (!deleted) throw new Error("Attempt not found");

			return { deleted: true };
		}),

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

			if (!session) throw new Error("Session not found");

			const attempts = await db
				.select()
				.from(pronunciationAttempt)
				.where(eq(pronunciationAttempt.sessionId, input.sessionId));

			return { ...session, attempts };
		}),

	getFeedback: protectedProcedure
		.input(z.object({ sessionId: z.string() }))
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [session] = await db
				.select({
					feedback: pronunciationSession.feedback,
					feedbackStatus: pronunciationSession.feedbackStatus,
				})
				.from(pronunciationSession)
				.where(
					and(
						eq(pronunciationSession.id, input.sessionId),
						eq(pronunciationSession.userId, userId),
					),
				)
				.limit(1);

			if (!session) throw new Error("Session not found");

			return {
				feedback: session.feedback,
				status: session.feedbackStatus,
			};
		}),

	getHistory: protectedProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(50).default(10),
			}),
		)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const sessions = await db
				.select({
					id: pronunciationSession.id,
					mode: pronunciationSession.mode,
					difficulty: pronunciationSession.difficulty,
					cefrLevel: pronunciationSession.cefrLevel,
					status: pronunciationSession.status,
					summary: pronunciationSession.summary,
					feedbackStatus: pronunciationSession.feedbackStatus,
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
				.limit(input.limit);

			return sessions;
		}),
});
