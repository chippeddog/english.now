import { and, db, eq, sql, userActivity, userProfile } from "@english.now/db";
import { z } from "zod";
import { protectedProcedure, router } from "../index";
import {
	getLessonAccessSummary,
	getPracticeAccessSummary,
	getVocabularyAccessSummary,
} from "../services/feature-gating";
import {
	getCurrentSubscription,
	getSubscriptionSummary,
} from "../services/subscription";

export const profileRouter = router({
	get: protectedProcedure.query(async ({ ctx }) => {
		const [profile, sub] = await Promise.all([
			db
				.select()
				.from(userProfile)
				.where(eq(userProfile.userId, ctx.session.user.id))
				.limit(1)
				.then(([result]) => result ?? null),
			getCurrentSubscription(ctx.session.user.id),
		]);

		if (!profile) return null;

		return {
			...profile,
			subscription: getSubscriptionSummary(sub),
		};
	}),
	getStreakData: protectedProcedure.query(async ({ ctx }) => {
		const [profile] = await db
			.select({
				currentStreak: userProfile.currentStreak,
				longestStreak: userProfile.longestStreak,
				lastActivityAt: userProfile.lastActivityAt,
				timezone: userProfile.timezone,
			})
			.from(userProfile)
			.where(eq(userProfile.userId, ctx.session.user.id))
			.limit(1);
		return profile ?? null;
	}),
	getWeeklyActivity: protectedProcedure
		.input(z.object({ timezone: z.string() }))
		.query(async ({ ctx, input }) => {
			const rows = await db
				.selectDistinct({
					date: sql<string>`to_char((${userActivity.activityAt} AT TIME ZONE ${input.timezone})::date, 'YYYY-MM-DD')`.as(
						"date",
					),
				})
				.from(userActivity)
				.where(
					and(
						eq(userActivity.userId, ctx.session.user.id),
						sql`${userActivity.activityAt} >= DATE_TRUNC('week', NOW() AT TIME ZONE ${input.timezone})::timestamptz`,
					),
				);

			return rows.map((r) => r.date);
		}),
	getDailyPracticeTime: protectedProcedure
		.input(z.object({ timezone: z.string() }))
		.query(async ({ ctx, input }) => {
			const rows = await db
				.select({
					date: sql<string>`to_char((${userActivity.activityAt} AT TIME ZONE ${input.timezone})::date, 'YYYY-MM-DD')`.as(
						"date",
					),
					seconds:
						sql<number>`COALESCE(SUM(${userActivity.durationSeconds}), 0)`.as(
							"seconds",
						),
				})
				.from(userActivity)
				.where(
					and(
						eq(userActivity.userId, ctx.session.user.id),
						sql`${userActivity.activityAt} >= DATE_TRUNC('week', NOW() AT TIME ZONE ${input.timezone})::timestamptz`,
					),
				)
				.groupBy(sql`1`);

			return rows.map((r) => ({ date: r.date, seconds: Number(r.seconds) }));
		}),
	getSubscription: protectedProcedure.query(async ({ ctx }) => {
		return getCurrentSubscription(ctx.session.user.id);
	}),
	getUsageLimits: protectedProcedure.query(async ({ ctx }) => {
		const [practice, lessons, vocabulary] = await Promise.all([
			getPracticeAccessSummary(ctx.session.user.id),
			getLessonAccessSummary(ctx.session.user.id),
			getVocabularyAccessSummary(ctx.session.user.id),
		]);

		return {
			isPro: practice.isPro,
			conversation: practice.conversation,
			pronunciation: practice.pronunciation,
			grammar: practice.grammar,
			lessonStarts: lessons.newLessonStarts,
			vocabularyAdds: vocabulary.adds,
			vocabularyReviews: vocabulary.reviews,
		};
	}),
	saveOnboarding: protectedProcedure
		.input(
			z.object({
				nativeLanguage: z.string(),
				proficiencyLevel: z.string(),
				dailyGoal: z.number(),
				focusAreas: z.array(z.string()),
				goal: z.string(),
				timezone: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await db
				.update(userProfile)
				.set({
					userId: ctx.session.user.id,
					nativeLanguage: input.nativeLanguage,
					level: input.proficiencyLevel,
					dailyGoal: input.dailyGoal,
					focusAreas: input.focusAreas,
					goal: input.goal,
					timezone: input.timezone,
					isOnboardingCompleted: true,
				})
				.where(eq(userProfile.userId, ctx.session.user.id));

			return { success: true };
		}),
	updateProfile: protectedProcedure
		.input(
			z.object({
				nativeLanguage: z.string().optional(),
				level: z.string().optional(),
				dailyGoal: z.number().optional(),
				focusAreas: z.array(z.string()).optional(),
				interests: z.array(z.string()).optional(),
				goal: z.string().optional(),
				timezone: z.string().optional(),
				voiceModel: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const updates: Record<string, unknown> = {
				updatedAt: new Date(),
			};
			if (input.nativeLanguage !== undefined)
				updates.nativeLanguage = input.nativeLanguage;
			if (input.level !== undefined) updates.level = input.level;
			if (input.dailyGoal !== undefined) updates.dailyGoal = input.dailyGoal;
			if (input.focusAreas !== undefined) updates.focusAreas = input.focusAreas;
			if (input.interests !== undefined) updates.interests = input.interests;
			if (input.goal !== undefined) updates.goal = input.goal;
			if (input.timezone !== undefined) updates.timezone = input.timezone;
			if (input.voiceModel !== undefined) updates.voiceModel = input.voiceModel;

			await db
				.update(userProfile)
				.set(updates)
				.where(eq(userProfile.userId, ctx.session.user.id));

			return { success: true };
		}),
});

export type ProfileRouter = typeof profileRouter;
