import { timeZoneSchema } from "@english.now/api/lib/timezone";
import { getDayKey } from "@english.now/api/services/daily-practice-plan";
import { getTimeZoneUpdate } from "@english.now/api/services/profile-timezone";
import { auth } from "@english.now/auth";
import { db, eq, userProfile } from "@english.now/db";
import { TRPCError } from "@trpc/server";
import type { Context, Next } from "hono";
import { Hono } from "hono";
import { z } from "zod";
import { jsonBodyLimit } from "@/middleware/body-limit";
import { rateLimit } from "@/middleware/rate-limit";
import {
	enqueueGenerateDailyPracticePlan,
	enqueueGenerateLearningPath,
} from "../jobs";
import { getQueue } from "../utils/queue";

type Variables = {
	session: Awaited<ReturnType<typeof auth.api.getSession>>;
};

const profile = new Hono<{ Variables: Variables }>();

const requireAuth = async (
	c: Context<{ Variables: Variables }>,
	next: Next,
) => {
	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session?.user?.id) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	c.set("session", session);
	return next();
};

const onboardingSchema = z.object({
	nativeLanguage: z.string().max(16).nullish(),
	proficiencyLevel: z.string().max(32).nullish(),
	dailyGoal: z.number().int().min(0).max(1440).nullish(),
	focusAreas: z.array(z.string().max(64)).max(20).nullish(),
	interests: z.array(z.string().max(64)).max(20).nullish(),
	goal: z.string().max(200).nullish(),
	timezone: timeZoneSchema.nullish(),
});

profile.post(
	"/onboarding",
	jsonBodyLimit,
	requireAuth,
	rateLimit({ max: 5, windowMs: 60_000 }),
	async (c) => {
		const session = c.get("session");
		if (!session) return c.json({ error: "Unauthorized" }, 401);
		const userId = session.user.id;

		const parsed = onboardingSchema.safeParse(
			await c.req.json().catch(() => null),
		);
		if (!parsed.success) {
			return c.json({ error: "Invalid request" }, 400);
		}
		const input = parsed.data;

		const [existing] = await db
			.select({ isOnboardingCompleted: userProfile.isOnboardingCompleted })
			.from(userProfile)
			.where(eq(userProfile.userId, userId))
			.limit(1);

		let timeZoneUpdate: Awaited<ReturnType<typeof getTimeZoneUpdate>> = {};
		if (input.timezone) {
			try {
				timeZoneUpdate = await getTimeZoneUpdate(userId, input.timezone);
			} catch (error) {
				if (error instanceof TRPCError && error.code === "TOO_MANY_REQUESTS") {
					return c.json({ error: error.message }, 429);
				}
				throw error;
			}
		}

		await db
			.update(userProfile)
			.set({
				nativeLanguage: input.nativeLanguage,
				level: input.proficiencyLevel,
				dailyGoal: input.dailyGoal,
				focusAreas: input.focusAreas,
				interests: input.interests,
				goal: input.goal,
				...timeZoneUpdate,
				isOnboardingCompleted: true,
				updatedAt: new Date(),
			})
			.where(eq(userProfile.userId, userId));

		const userTimezone = timeZoneUpdate.timezone ?? input.timezone ?? "UTC";
		const boss = getQueue();

		await Promise.all([
			// Re-submitting onboarding must not re-run AI generation.
			existing?.isOnboardingCompleted
				? Promise.resolve()
				: enqueueGenerateLearningPath(boss, { userId }),
			enqueueGenerateDailyPracticePlan(boss, {
				userId,
				dayKey: getDayKey(new Date(), userTimezone),
			}),
		]);

		return c.json({ success: true });
	},
);

// Get profile data
profile.get("/", requireAuth, async (c) => {
	const session = c.get("session");
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const [result] = await db
		.select()
		.from(userProfile)
		.where(eq(userProfile.userId, session.user.id))
		.limit(1);

	return c.json(result ?? null);
});

export default profile;
