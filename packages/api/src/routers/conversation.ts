import { createOpenAI } from "@ai-sdk/openai";
import {
	conversationMessage,
	conversationReviewAttempt,
	conversationSession,
	conversationSuggestion,
	db,
	userProfile,
} from "@english.now/db";
import { env } from "@english.now/env/server";
import { TRPCError } from "@trpc/server";
import { generateText, Output } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, rateLimitedProcedure, router } from "../index";
import { getConversationReviewData } from "../services/conversation-review";
import {
	getTodayPracticePlanRecord,
	markDailyPracticeActivityStarted,
} from "../services/daily-practice-plan";
import {
	getConversationAccessSummary,
	getConversationReplyAccessSummary,
} from "../services/feature-gating";
import { recordDailyFeatureUsage } from "../services/feature-usage";
import { generateSuggestions } from "../services/generate-suggestions";

const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });

export const conversationRouter = router({
	getSuggestions: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const profile = await db
			.select()
			.from(userProfile)
			.where(eq(userProfile.userId, userId))
			.limit(1);

		const userTz = profile[0]?.timezone || "UTC";

		// Check for existing suggestions
		const existing = await db
			.select()
			.from(conversationSuggestion)
			.where(eq(conversationSuggestion.userId, userId))
			.limit(1);

		if (existing[0]) {
			// Check if suggestions are still fresh (generated today in user's timezone)
			const formatter = new Intl.DateTimeFormat("en-CA", {
				timeZone: userTz,
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			});
			const todayInUserTz = formatter.format(new Date());
			const generatedDateInUserTz = formatter.format(existing[0].generatedAt);

			if (todayInUserTz === generatedDateInUserTz) {
				return {
					topics: existing[0].topics,
					roleplays: existing[0].roleplays,
					generatedAt: existing[0].generatedAt,
					isStale: false,
				};
			}
		}

		// Suggestions are stale or don't exist — return stale data + flag to regenerate
		return {
			topics: existing[0]?.topics ?? null,
			roleplays: existing[0]?.roleplays ?? null,
			generatedAt: existing[0]?.generatedAt ?? null,
			isStale: true,
		};
	}),

	// Regenerate personalized suggestions (called when stale)
	regenerateSuggestions: protectedProcedure.mutation(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const profile = await db
			.select()
			.from(userProfile)
			.where(eq(userProfile.userId, userId))
			.limit(1);

		const suggestions = await generateSuggestions({
			level: profile[0]?.level ?? null,
			interests: profile[0]?.interests ?? null,
			focusAreas: profile[0]?.focusAreas ?? null,
			goal: profile[0]?.goal ?? null,
			nativeLanguage: profile[0]?.nativeLanguage ?? null,
		});

		// Upsert: delete existing then insert new
		const existing = await db
			.select()
			.from(conversationSuggestion)
			.where(eq(conversationSuggestion.userId, userId))
			.limit(1);

		if (existing[0]) {
			await db
				.update(conversationSuggestion)
				.set({
					topics: suggestions.topics,
					roleplays: suggestions.roleplays,
					generatedAt: new Date(),
				})
				.where(eq(conversationSuggestion.userId, userId));
		} else {
			await db.insert(conversationSuggestion).values({
				id: crypto.randomUUID(),
				userId,
				topics: suggestions.topics,
				roleplays: suggestions.roleplays,
				generatedAt: new Date(),
			});
		}

		return {
			topics: suggestions.topics,
			roleplays: suggestions.roleplays,
			generatedAt: new Date(),
			isStale: false,
		};
	}),

	start: protectedProcedure
		.input(
			z.object({
				activityId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const sessionId = crypto.randomUUID();
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
				(item) => item.id === input.activityId && item.type === "conversation",
			);

			if (!activity || activity.type !== "conversation") {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "PRACTICE_ACTIVITY_NOT_FOUND",
				});
			}

			const access = await getConversationAccessSummary(userId);

			if (!access.isPro && !access.hasAccess) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "FREE_DAILY_LIMIT_REACHED",
					cause: access,
				});
			}

			const level = profile[0]?.level ?? "beginner";
			const scenarioName = activity.payload.scenarioName;
			const scenarioDescription = activity.payload.scenarioDescription;
			const aiRole = activity.payload.aiRole ?? "conversation partner";
			const goals = [
				`Practice ${scenarioName}-related vocabulary`,
				"Build conversational confidence",
				"Learn natural expressions",
			];
			const systemPrompt = `You are a ${aiRole} in a ${scenarioName} scenario. ${scenarioDescription}.
The person you're talking to is learning English at a ${level} level.
- Keep your language appropriate for their level
- Be encouraging and supportive
- After they respond, provide helpful corrections for any grammar or vocabulary mistakes
- Ask follow-up questions to keep the conversation flowing
- Use natural, authentic language for this scenario`;
			const greeting = generateDynamicGreeting(scenarioName, aiRole, level);

			const newSession = {
				id: sessionId,
				userId,
				scenario: scenarioName,
				level: level,
				context: {
					systemPrompt,
					scenarioDescription,
					goals,
					scenarioType: activity.payload.scenarioType,
					aiRole,
				},
				status: "active",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			await db.insert(conversationSession).values(newSession);

			const messageId = crypto.randomUUID();
			await db.insert(conversationMessage).values({
				id: messageId,
				sessionId,
				role: "assistant",
				content: greeting,
				createdAt: new Date(),
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
				feature: "conversation_session",
				resourceId: sessionId,
				metadata: {
					activityId: activity.id,
					scenario: activity.payload.scenario,
				},
			});

			return {
				sessionId,
				scenario: {
					id: activity.payload.scenario,
					name: scenarioName,
					description: scenarioDescription,
					goals,
				},
				level: level,
				initialMessage: {
					id: messageId,
					role: "assistant" as const,
					content: greeting,
				},
			};
		}),

	// Get session details with messages
	getSession: protectedProcedure
		.input(z.object({ sessionId: z.string() }))
		.query(async ({ ctx, input }) => {
			const session = await db
				.select()
				.from(conversationSession)
				.where(eq(conversationSession.id, input.sessionId))
				.limit(1);

			if (!session[0] || session[0].userId !== ctx.session.user.id) {
				throw new Error("Session not found");
			}

			const messages = await db
				.select()
				.from(conversationMessage)
				.where(eq(conversationMessage.sessionId, input.sessionId))
				.orderBy(conversationMessage.createdAt);
			const assistantReplies = messages.filter(
				(message) => message.role === "assistant",
			).length;
			const replyAccess = await getConversationReplyAccessSummary(
				ctx.session.user.id,
				assistantReplies,
			);

			return {
				session: session[0],
				messages,
				replyAccess,
			};
		}),

	getReview: protectedProcedure
		.input(z.object({ sessionId: z.string() }))
		.query(async ({ ctx, input }) => {
			return getConversationReviewData({
				sessionId: input.sessionId,
				userId: ctx.session.user.id,
			});
		}),

	saveReviewTaskResult: protectedProcedure
		.input(
			z.object({
				sessionId: z.string(),
				taskId: z.string(),
				problemId: z.string(),
				type: z.enum(["grammar", "vocabulary", "pronunciation"]),
				status: z.enum(["practiced", "completed", "skipped"]),
				result: z.record(z.string(), z.unknown()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const reviewData = await getConversationReviewData({
				sessionId: input.sessionId,
				userId: ctx.session.user.id,
			});

			const task = reviewData.review?.tasks.find(
				(item) =>
					item.id === input.taskId &&
					item.problemId === input.problemId &&
					item.type === input.type,
			);

			if (!task) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Review task not found",
				});
			}

			const now = new Date();
			await db
				.insert(conversationReviewAttempt)
				.values({
					id: crypto.randomUUID(),
					sessionId: input.sessionId,
					userId: ctx.session.user.id,
					taskId: input.taskId,
					problemId: input.problemId,
					type: input.type,
					status: input.status,
					result: input.result ?? null,
					createdAt: now,
					updatedAt: now,
				})
				.onConflictDoUpdate({
					target: [
						conversationReviewAttempt.sessionId,
						conversationReviewAttempt.userId,
						conversationReviewAttempt.taskId,
					],
					set: {
						problemId: input.problemId,
						type: input.type,
						status: input.status,
						result: input.result ?? null,
						updatedAt: now,
					},
				});

			return getConversationReviewData({
				sessionId: input.sessionId,
				userId: ctx.session.user.id,
			});
		}),

	// Send a text message (non-streaming, for tRPC)
	sendMessage: protectedProcedure
		.input(
			z.object({
				sessionId: z.string(),
				content: z.string().min(1).max(2000),
				inputType: z.enum(["text", "voice"]).default("text"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Verify session belongs to user
			const session = await db
				.select()
				.from(conversationSession)
				.where(eq(conversationSession.id, input.sessionId))
				.limit(1);

			if (!session[0] || session[0].userId !== ctx.session.user.id) {
				throw new Error("Session not found");
			}

			// Save user message
			const userMessageId = crypto.randomUUID();
			await db.insert(conversationMessage).values({
				id: userMessageId,
				sessionId: input.sessionId,
				role: "user",
				content: input.content,
				metadata: { transcribedFrom: input.inputType },
				createdAt: new Date(),
			});

			// This returns a placeholder - actual AI response will be streamed via REST endpoint
			return {
				userMessageId,
				sessionId: input.sessionId,
				// Client should call /api/conversation/stream for the AI response
			};
		}),

	translate: rateLimitedProcedure(5, 60_000)
		.input(z.object({ text: z.string().min(1).max(5000) }))
		.mutation(async ({ ctx, input }) => {
			const profile = await db
				.select()
				.from(userProfile)
				.where(eq(userProfile.userId, ctx.session.user.id))
				.limit(1);

			const nativeLanguage = profile[0]?.nativeLanguage ?? "Spanish";

			const { output } = await generateText({
				model: openai("gpt-4o-mini"),
				output: Output.text(),
				system: `You are a translator. Translate the following English text to ${nativeLanguage}. Return ONLY the translation, nothing else.`,
				prompt: input.text,
				temperature: 0.3,
			});

			if (!output) {
				throw new Error("Failed to generate translation");
			}

			return { translation: output };
		}),

	hint: rateLimitedProcedure(10, 60_000)
		.input(z.object({ sessionId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const session = await db
				.select()
				.from(conversationSession)
				.where(eq(conversationSession.id, input.sessionId))
				.limit(1);

			if (!session[0] || session[0].userId !== ctx.session.user.id) {
				throw new Error("Session not found");
			}

			const profile = await db
				.select()
				.from(userProfile)
				.where(eq(userProfile.userId, ctx.session.user.id))
				.limit(1);

			const nativeLanguage = profile[0]?.nativeLanguage ?? "Spanish";
			const level = session[0].level ?? "beginner";

			const history = await db
				.select()
				.from(conversationMessage)
				.where(eq(conversationMessage.sessionId, input.sessionId))
				.orderBy(conversationMessage.createdAt);

			const conversationHistory = history
				.map(
					(message) =>
						`${message.role === "user" ? "User" : "Assistant"}: ${message.content}`,
				)
				.join("\n");

			const { output } = await generateText({
				model: openai("gpt-4o-mini"),
				output: Output.text(),
				system: `You help English learners figure out what to say next in a conversation.
The learner speaks ${nativeLanguage} and is at a ${level} English level.
Based on the conversation so far, suggest 2-3 short response options the user could say (in English).
Keep suggestions appropriate for their level.
Format each suggestion on its own line, prefixed with "•". Do NOT add explanations — just the suggestions.`,
				prompt: conversationHistory,
				temperature: 0.7,
			});

			return {
				suggestions: (output ?? "")
					.split("\n")
					.map((line) => line.replace(/^•\s*/, "").trim())
					.filter(Boolean),
			};
		}),

	endSession: protectedProcedure
		.input(z.object({ sessionId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const session = await db
				.select()
				.from(conversationSession)
				.where(eq(conversationSession.id, input.sessionId))
				.limit(1);

			if (!session[0] || session[0].userId !== ctx.session.user.id) {
				throw new Error("Session not found");
			}

			await db
				.update(conversationSession)
				.set({ status: "completed", updatedAt: new Date() })
				.where(eq(conversationSession.id, input.sessionId));

			return { success: true };
		}),
});

function generateDynamicGreeting(
	scenarioName: string,
	aiRole: string,
	level: string,
): string {
	const greetings: Record<string, string> = {
		beginner: `Hello! I'm your ${aiRole} today. Let's talk about ${scenarioName}. Are you ready to start?`,
		intermediate: `Hi there! Welcome to our ${scenarioName} session. I'll be your ${aiRole} today. How are you doing? Let's get started!`,
		advanced: `Good to meet you! I'll be acting as your ${aiRole} for this ${scenarioName} scenario. Feel free to jump right in — I'm here to make this feel as natural and engaging as possible. What's on your mind?`,
	};
	return (
		greetings[level] ??
		`Hello! I'm your ${aiRole} today. Let's talk about ${scenarioName}. Are you ready to start?`
	);
}
