import {
	and,
	db,
	desc,
	eq,
	sql,
	subscription,
	userActivity,
	userProfile,
} from "@english.now/db";
import { z } from "zod";
import { protectedProcedure, router } from "../index";

export const profileRouter = router({
	get: protectedProcedure.query(async ({ ctx }) => {
		const [profile] = await db
			.select()
			.from(userProfile)
			.where(eq(userProfile.userId, ctx.session.user.id))
			.limit(1);
		return profile ?? null;
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
	getSubscription: protectedProcedure.query(async ({ ctx }) => {
		const [sub] = await db
			.select()
			.from(subscription)
			.where(eq(subscription.userId, ctx.session.user.id))
			.orderBy(desc(subscription.createdAt))
			.limit(1);
		return sub ?? null;
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
			if (input.voiceModel !== undefined) updates.voiceModel = input.voiceModel;

			await db
				.update(userProfile)
				.set(updates)
				.where(eq(userProfile.userId, ctx.session.user.id));

			return { success: true };
		}),
});

export type ProfileRouter = typeof profileRouter;
