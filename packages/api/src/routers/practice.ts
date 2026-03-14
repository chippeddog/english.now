import type { PronunciationSessionSummary } from "@english.now/db";
import {
	and,
	conversationSession,
	db,
	desc,
	eq,
	isNull,
	lt,
	pronunciationSession,
} from "@english.now/db";
import { z } from "zod";
import { protectedProcedure, router } from "../index";
import {
	ensureTodayPracticePlan,
	getHomeActivities,
	getTodayPracticePlanRecord,
	markDailyPracticeActivityCompleted,
	markDailyPracticeActivityStarted,
} from "../services/daily-practice-plan";
import { getPracticeAccessSummary } from "../services/feature-gating";
import { recordDailyFeatureUsage } from "../services/feature-usage";
import { recordActivity } from "../services/record-activity";

export const practiceRouter = router({
	ensureTodayPlan: protectedProcedure.mutation(async ({ ctx }) => {
		if (!ctx.enqueueDailyPracticePlan) {
			throw new Error("Daily practice queue is not configured");
		}

		const { plan, wasEnqueued } = await ensureTodayPracticePlan(
			ctx.session.user.id,
			ctx.enqueueDailyPracticePlan,
		);

		return {
			status: plan.status,
			generatedAt: plan.generatedAt,
			wasEnqueued,
		};
	}),

	getTodayPlan: protectedProcedure.query(async ({ ctx }) => {
		const { plan } = await getTodayPracticePlanRecord(ctx.session.user.id);
		const access = await getPracticeAccessSummary(ctx.session.user.id);

		return {
			status: plan?.status ?? "missing",
			activities: plan?.activities ?? [],
			generatedAt: plan?.generatedAt ?? null,
			error: plan?.error ?? null,
			access,
		};
	}),

	getHomeTodayPlan: protectedProcedure.query(async ({ ctx }) => {
		const { plan } = await getTodayPracticePlanRecord(ctx.session.user.id);
		const access = await getPracticeAccessSummary(ctx.session.user.id);

		return {
			status: plan?.status ?? "missing",
			activities: plan ? getHomeActivities(plan) : [],
			generatedAt: plan?.generatedAt ?? null,
			error: plan?.error ?? null,
			access,
		};
	}),

	startActivity: protectedProcedure
		.input(
			z.object({
				activityId: z.string(),
				sessionId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const success = await markDailyPracticeActivityStarted(
				ctx.session.user.id,
				input,
			);

			if (!success) {
				throw new Error("Activity not found");
			}

			return { success: true };
		}),

	markActivityDone: protectedProcedure
		.input(
			z.object({
				activityId: z.string(),
				sessionId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { plan } = await getTodayPracticePlanRecord(ctx.session.user.id);
			const activity = plan?.activities.find(
				(item) => item.id === input.activityId,
			);
			const success = await markDailyPracticeActivityCompleted(
				ctx.session.user.id,
				input,
			);

			if (!success) {
				throw new Error("Activity not found");
			}

			if (
				activity?.type === "vocabulary" &&
				!activity.completedAt &&
				activity.payload.cards.length > 0
			) {
				await recordDailyFeatureUsage({
					userId: ctx.session.user.id,
					feature: "vocabulary_review",
					resourceId: activity.id,
					count: activity.payload.cards.length,
					metadata: {
						focus: activity.payload.focus,
					},
				});
			}

			return { success: true };
		}),

	deleteSession: protectedProcedure
		.input(
			z.object({
				sessionId: z.string(),
				type: z.enum(["conversation", "pronunciation"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const now = new Date();

			if (input.type === "conversation") {
				const result = await db
					.update(conversationSession)
					.set({ deletedAt: now })
					.where(
						and(
							eq(conversationSession.id, input.sessionId),
							eq(conversationSession.userId, userId),
						),
					)
					.returning({ id: conversationSession.id });

				if (result.length === 0) {
					throw new Error("Session not found");
				}
			} else {
				const result = await db
					.update(pronunciationSession)
					.set({ deletedAt: now })
					.where(
						and(
							eq(pronunciationSession.id, input.sessionId),
							eq(pronunciationSession.userId, userId),
						),
					)
					.returning({ id: pronunciationSession.id });

				if (result.length === 0) {
					throw new Error("Session not found");
				}
			}

			return { success: true };
		}),

	recordPracticeTime: protectedProcedure
		.input(
			z.object({
				activityType: z.string(),
				durationSeconds: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await recordActivity(
				ctx.session.user.id,
				input.activityType,
				input.durationSeconds,
			);
			return { success: true };
		}),

	getRecentSessions: protectedProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(50).default(10),
				type: z.enum(["all", "conversation", "pronunciation"]).default("all"),
				cursor: z.string().datetime().nullish(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const { limit, type, cursor } = input;
			const fetchLimit = limit + 1;

			const cursorDate = cursor ? new Date(cursor) : undefined;

			const includePronunciation = type === "all" || type === "pronunciation";
			const includeConversation = type === "all" || type === "conversation";

			const [pronResults, convResults] = await Promise.all([
				includePronunciation
					? db
							.select({
								id: pronunciationSession.id,
								mode: pronunciationSession.mode,
								level: pronunciationSession.level,
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
									cursorDate
										? lt(pronunciationSession.createdAt, cursorDate)
										: undefined,
								),
							)
							.orderBy(desc(pronunciationSession.createdAt))
							.limit(fetchLimit)
					: [],
				includeConversation
					? db
							.select({
								id: conversationSession.id,
								scenario: conversationSession.scenario,
								level: conversationSession.level,
								status: conversationSession.status,
								createdAt: conversationSession.createdAt,
							})
							.from(conversationSession)
							.where(
								and(
									eq(conversationSession.userId, userId),
									isNull(conversationSession.deletedAt),
									cursorDate
										? lt(conversationSession.createdAt, cursorDate)
										: undefined,
								),
							)
							.orderBy(desc(conversationSession.createdAt))
							.limit(fetchLimit)
					: [],
			]);

			const unified = [
				...pronResults.map((s) => ({
					id: s.id,
					type: "pronunciation" as const,
					title: s.mode === "read-aloud" ? "Read Aloud" : "Tongue Twisters",
					mode: s.mode,
					status: s.status,
					score:
						(s.summary as PronunciationSessionSummary | null)?.averageScore ??
						null,
					createdAt: s.createdAt,
				})),
				...convResults.map((s) => ({
					id: s.id,
					type: "conversation" as const,
					title: s.scenario,
					mode: null,
					status: s.status,
					score: null,
					createdAt: s.createdAt,
				})),
			];

			unified.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

			const items = unified.slice(0, limit);
			const hasMore = unified.length > limit;
			const nextCursor = hasMore
				? items[items.length - 1]?.createdAt.toISOString()
				: null;

			return { items, nextCursor };
		}),
});
