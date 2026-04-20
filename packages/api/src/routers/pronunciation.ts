import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
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
import { env } from "@english.now/env/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, rateLimitedProcedure, router } from "../index";
import { profileLevelToCefr } from "../lib/cefr";
import {
	getTodayPracticePlanRecord,
	markDailyPracticeActivityStarted,
} from "../services/daily-practice-plan";
import {
	getPronunciationAccessSummary,
	getPronunciationAttemptAccessSummary,
	getReportAccessSummary,
} from "../services/feature-gating";
import { recordDailyFeatureUsage } from "../services/feature-usage";
import { generateParagraph } from "../services/generate-paragraph";
import { recordActivity } from "../services/record-activity";

const pronunciationAudioBucket = "_audio";

const s3 = new S3Client({
	region: "auto",
	endpoint: env.R2_ENDPOINT,
	credentials: {
		accessKeyId: env.R2_ACCESS_KEY_ID,
		secretAccessKey: env.R2_SECRET_ACCESS_KEY,
	},
});

function getAudioStorageKey(audioUrl: string) {
	const publicUrl = new URL(env.R2_PUBLIC_URL);
	const fileUrl = new URL(audioUrl);

	if (fileUrl.origin !== publicUrl.origin) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "INVALID_ATTEMPT_AUDIO_URL",
		});
	}

	const pathSegments = fileUrl.pathname.split("/").filter(Boolean);
	const bucketIndex = pathSegments.indexOf(pronunciationAudioBucket);

	if (bucketIndex === -1 || bucketIndex === pathSegments.length - 1) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "INVALID_ATTEMPT_AUDIO_URL",
		});
	}

	return decodeURIComponent(pathSegments.slice(bucketIndex + 1).join("/"));
}

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
				activityId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [profile, { plan }] = await Promise.all([
				db
					.select()
					.from(userProfile)
					.where(eq(userProfile.userId, userId))
					.limit(1),
				getTodayPracticePlanRecord(userId),
			]);

			if (!plan || plan.status !== "ready") {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "TODAY_PLAN_NOT_READY",
				});
			}

			const activity = plan.activities.find(
				(item) => item.id === input.activityId && item.type === "pronunciation",
			);

			if (!activity || activity.type !== "pronunciation") {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "PRACTICE_ACTIVITY_NOT_FOUND",
				});
			}

			const access = await getPronunciationAccessSummary(userId);

			if (!access.isPro && !access.hasAccess) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "FREE_DAILY_LIMIT_REACHED",
					cause: access,
				});
			}

			const level = profileLevelToCefr(profile[0]?.level);
			const paragraph = activity.payload.paragraph;

			const sessionId = crypto.randomUUID();

			await db.insert(pronunciationSession).values({
				id: sessionId,
				userId,
				mode: "read-aloud",
				level,
				paragraph,
				items: [paragraph],
				status: "active",
			});

			const markedStarted = await markDailyPracticeActivityStarted(userId, {
				activityId: activity.id,
				sessionId,
			});

			if (!markedStarted) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "PRACTICE_ACTIVITY_NOT_FOUND",
				});
			}

			await recordDailyFeatureUsage({
				userId,
				feature: "pronunciation_session",
				resourceId: sessionId,
				metadata: {
					activityId: activity.id,
				},
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
			const transcript = input.transcript.trim();

			if (!transcript) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "EMPTY_ATTEMPT_TRANSCRIPT",
				});
			}

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

			const existingAttempts = await db
				.select({ id: pronunciationAttempt.id })
				.from(pronunciationAttempt)
				.where(eq(pronunciationAttempt.sessionId, input.sessionId));
			const attemptAccess = await getPronunciationAttemptAccessSummary(
				userId,
				existingAttempts.length,
			);

			if (attemptAccess.reachedLimit) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: attemptAccess.isPro
						? "PRO_ATTEMPT_LIMIT_REACHED"
						: "FREE_ATTEMPT_LIMIT_REACHED",
					cause: attemptAccess,
				});
			}

			const attemptId = crypto.randomUUID();

			await db.insert(pronunciationAttempt).values({
				id: attemptId,
				sessionId: input.sessionId,
				itemIndex: input.itemIndex,
				transcript,
				score: 0,
				wordResults: [],
				audioUrl: input.audioUrl,
			});

			return { attemptId };
		}),

	completeSession: protectedProcedure
		.input(
			z.object({
				sessionId: z.string(),
				durationSeconds: z.number().optional(),
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

			recordActivity(userId, "pronunciation", input.durationSeconds).catch(
				console.error,
			);

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

			const [attempt] = await db
				.select({
					id: pronunciationAttempt.id,
					audioUrl: pronunciationAttempt.audioUrl,
				})
				.from(pronunciationAttempt)
				.where(
					and(
						eq(pronunciationAttempt.id, input.attemptId),
						eq(pronunciationAttempt.sessionId, input.sessionId),
					),
				)
				.limit(1);

			if (!attempt) throw new Error("Attempt not found");

			if (attempt.audioUrl) {
				await s3.send(
					new DeleteObjectCommand({
						Bucket: pronunciationAudioBucket,
						Key: getAudioStorageKey(attempt.audioUrl),
					}),
				);
			}

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
			const reportAccess = await getReportAccessSummary(userId);
			const attemptAccess = await getPronunciationAttemptAccessSummary(
				userId,
				attempts.length,
			);

			return {
				...session,
				attempts:
					reportAccess.locked && session.status === "completed" ? [] : attempts,
				summary:
					reportAccess.locked && session.summary
						? maskPronunciationSummary(
								session.summary as PronunciationSessionSummary,
							)
						: session.summary,
				reportAccess,
				attemptAccess,
			};
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

			const reportAccess = await getReportAccessSummary(userId);

			return {
				feedback: reportAccess.locked ? null : session.feedback,
				status: session.feedbackStatus,
				reportAccess,
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
					level: pronunciationSession.level,
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

function maskPronunciationSummary(
	summary: PronunciationSessionSummary,
): PronunciationSessionSummary {
	return {
		averageScore: summary.averageScore,
		averageAccuracy: summary.averageScore,
		averageFluency: summary.averageScore,
		averageProsody: summary.averageScore,
		averageCompleteness: summary.averageScore,
		totalAttempts: summary.totalAttempts,
		bestScore: summary.averageScore,
		worstScore: summary.averageScore,
		weakWords: [],
		weakPhonemes: [],
	};
}
