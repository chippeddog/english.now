import { createOpenAI } from "@ai-sdk/openai";
import type {
	DailyActivityItem,
	PronunciationSessionSummary,
} from "@english.now/db";
import {
	and,
	conversationSession,
	dailySuggestion,
	db,
	desc,
	eq,
	isNull,
	pronunciationSession,
	userProfile,
} from "@english.now/db";
import { env } from "@english.now/env/server";
import { generateText, Output } from "ai";
import { z } from "zod";
import { protectedProcedure, router } from "../index";

const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });

const dailyActivitiesSchema = z.object({
	activities: z.array(
		z.object({
			id: z.string().describe("kebab-case unique ID, e.g. 'describe-morning'"),
			emoji: z.string().describe("Single emoji representing the activity"),
			title: z
				.string()
				.describe("Short, engaging title (3-6 words). Action-oriented."),
			description: z
				.string()
				.describe("One sentence describing what the learner will practice"),
			duration: z
				.number()
				.describe(
					"Estimated minutes (1-5 for pronunciation, 3-8 for conversation)",
				),
			type: z.enum(["pronunciation", "conversation"]).describe("Activity type"),
			typeLabel: z
				.string()
				.describe("Human-readable label: 'Read Aloud' or 'Conversation'"),
			metadata: z.object({
				scenario: z
					.string()
					.describe(
						"For conversation: kebab-case scenario ID. Empty string for pronunciation.",
					),
				scenarioName: z
					.string()
					.describe(
						"For conversation: display name of scenario. Empty string for pronunciation.",
					),
				scenarioDescription: z
					.string()
					.describe(
						"For conversation: one-line description. Empty string for pronunciation.",
					),
				aiRole: z
					.string()
					.describe(
						"For conversation: role the AI plays. Empty string for pronunciation.",
					),
				cefrLevel: z
					.string()
					.describe(
						"For pronunciation: CEFR level (A1-C1). Empty string for conversation.",
					),
			}),
		}),
	),
});

function profileLevelToCefr(level: string | null | undefined): string {
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

async function generateDailyActivities(profile: {
	level: string | null;
	interests: string[] | null;
	focusAreas: string[] | null;
	goal: string | null;
	nativeLanguage: string | null;
}): Promise<DailyActivityItem[]> {
	const level = profile.level || "beginner";
	const cefrLevel = profileLevelToCefr(level);
	const interests = profile.interests?.length
		? profile.interests.join(", ")
		: "general topics";
	const focusAreas = profile.focusAreas?.length
		? profile.focusAreas.join(", ")
		: "general English";
	const goal = profile.goal || "improve English skills";
	const nativeLanguage = profile.nativeLanguage || "unknown";

	const { output } = await generateText({
		model: openai("gpt-4o-mini"),
		output: Output.object({ schema: dailyActivitiesSchema }),
		system: `You are an expert English tutor creating a personalized daily practice plan.

Generate exactly 9 activities: 3 pronunciation (Read Aloud) and 6 conversation activities.

Learner profile:
- English level: ${level} (CEFR: ${cefrLevel})
- Interests: ${interests}
- Focus areas: ${focusAreas}
- Learning goal: ${goal}
- Native language: ${nativeLanguage}

Rules:
- Create activities that feel personalized to this specific learner
- Pronunciation activities should have typeLabel "Read Aloud" and include cefrLevel "${cefrLevel}" in metadata
- Conversation activities should include scenario (kebab-case), scenarioName, scenarioDescription, and aiRole in metadata
- Alternate types: pronunciation, conversation, pronunciation, conversation, pronunciation, conversation
- Titles should be catchy and action-oriented (e.g. "Order at a Café", "Describe Your Dream Job")
- Each activity should be unique and varied — mix topics that match their interests with practical scenarios
- Durations: pronunciation 1-4 min, conversation 3-7 min
- Emojis should be relevant and distinct for each activity
- For pronunciation activities: set scenario, scenarioName, scenarioDescription, aiRole to empty string ""
- For conversation activities: set cefrLevel to empty string ""`,
		prompt: `Generate 6 personalized daily practice activities for this ${level}-level English learner interested in ${interests}.`,
		temperature: 0.9,
	});

	if (!output) throw new Error("Failed to generate daily activities");

	return output.activities.map((a) => ({
		...a,
		metadata: {
			scenario: a.metadata.scenario || undefined,
			scenarioName: a.metadata.scenarioName || undefined,
			scenarioDescription: a.metadata.scenarioDescription || undefined,
			aiRole: a.metadata.aiRole || undefined,
			cefrLevel: a.metadata.cefrLevel || undefined,
		},
		completedAt: null,
		sessionId: null,
	}));
}

export const practiceRouter = router({
	getDailySuggestions: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const [profile] = await db
			.select()
			.from(userProfile)
			.where(eq(userProfile.userId, userId))
			.limit(1);

		const userTz = profile?.timezone || "UTC";

		const [existing] = await db
			.select()
			.from(dailySuggestion)
			.where(eq(dailySuggestion.userId, userId))
			.limit(1);

		if (existing) {
			const formatter = new Intl.DateTimeFormat("en-CA", {
				timeZone: userTz,
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			});
			const todayInUserTz = formatter.format(new Date());
			const generatedDateInUserTz = formatter.format(existing.generatedAt);

			if (todayInUserTz === generatedDateInUserTz) {
				return {
					activities: existing.activities,
					generatedAt: existing.generatedAt,
					isStale: false,
				};
			}
		}

		return {
			activities: existing?.activities ?? null,
			generatedAt: existing?.generatedAt ?? null,
			isStale: true,
		};
	}),

	regenerateDailySuggestions: protectedProcedure.mutation(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const [profile] = await db
			.select()
			.from(userProfile)
			.where(eq(userProfile.userId, userId))
			.limit(1);

		const activities = await generateDailyActivities({
			level: profile?.level ?? null,
			interests: profile?.interests ?? null,
			focusAreas: profile?.focusAreas ?? null,
			goal: profile?.goal ?? null,
			nativeLanguage: profile?.nativeLanguage ?? null,
		});

		const [existing] = await db
			.select()
			.from(dailySuggestion)
			.where(eq(dailySuggestion.userId, userId))
			.limit(1);

		if (existing) {
			await db
				.update(dailySuggestion)
				.set({
					activities,
					generatedAt: new Date(),
				})
				.where(eq(dailySuggestion.userId, userId));
		} else {
			await db.insert(dailySuggestion).values({
				id: crypto.randomUUID(),
				userId,
				activities,
				generatedAt: new Date(),
			});
		}

		return {
			activities,
			generatedAt: new Date(),
			isStale: false,
		};
	}),

	markActivityDone: protectedProcedure
		.input(
			z.object({
				activityId: z.string(),
				sessionId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [existing] = await db
				.select()
				.from(dailySuggestion)
				.where(eq(dailySuggestion.userId, userId))
				.limit(1);

			if (!existing) throw new Error("No daily suggestions found");

			const updated = existing.activities.map((a) =>
				a.id === input.activityId
					? {
							...a,
							completedAt: new Date().toISOString(),
							sessionId: input.sessionId,
						}
					: a,
			);

			await db
				.update(dailySuggestion)
				.set({ activities: updated })
				.where(eq(dailySuggestion.userId, userId));

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

	getRecentSessions: protectedProcedure
		.input(
			z
				.object({
					limit: z.number().min(1).max(50).default(20),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const limit = input?.limit ?? 20;

			const [pronunciationSessions, conversationSessions] = await Promise.all([
				db
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
					.limit(limit),
				db
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
						),
					)
					.orderBy(desc(conversationSession.createdAt))
					.limit(limit),
			]);

			const unified = [
				...pronunciationSessions.map((s) => ({
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
				...conversationSessions.map((s) => ({
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

			return unified.slice(0, limit);
		}),
});
