import type {
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
import { z } from "zod";
import { protectedProcedure, rateLimitedProcedure, router } from "../index";
import { profileLevelToCefr } from "../lib/cefr";
import {
	generateParagraph,
	paragraphSchema,
} from "../services/generate-paragraph";
import { recordActivity } from "../services/record-activity";

export const pronunciationRouter = router({
	generatePreview: rateLimitedProcedure(5, 60_000).mutation(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const [profile] = await db
			.select()
			.from(userProfile)
			.where(eq(userProfile.userId, userId))
			.limit(1);

		const level = profileLevelToCefr(profile?.level);
		const paragraph = await generateParagraph(
			level,
			profile?.interests ?? undefined,
		);

		return { paragraph, level };
	}),

	startSession: rateLimitedProcedure(5, 60_000)
		.input(
			z.object({
				paragraph: paragraphSchema
					.extend({
						cefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1"]),
						wordCount: z.number(),
					})
					.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [profile] = await db
				.select()
				.from(userProfile)
				.where(eq(userProfile.userId, userId))
				.limit(1);

			const level = profileLevelToCefr(profile?.level);

			const paragraph =
				input.paragraph ??
				(await generateParagraph(level, profile?.interests ?? undefined));

			const sessionId = crypto.randomUUID();

			await recordActivity(userId, "pronunciation");

			await db.insert(pronunciationSession).values({
				id: sessionId,
				userId,
				mode: "read-aloud",
				level,
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
