import { createOpenAI } from "@ai-sdk/openai";
import type { ConversationRoleplay, ConversationTopic } from "@english.now/db";
import {
	conversationMessage,
	conversationSession,
	conversationSuggestion,
	db,
	userProfile,
} from "@english.now/db";
import { env } from "@english.now/env/server";
import { generateText, Output } from "ai";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, rateLimitedProcedure, router } from "../index";
import { generateSuggestions } from "../services/generate-suggestions";
import { recordActivity } from "../services/record-activity";

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
				scenario: z.string(),
				scenarioName: z.string().optional(),
				scenarioDescription: z.string().optional(),
				aiRole: z.string().optional(),
				scenarioType: z.enum(["topic", "roleplay"]).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const sessionId = crypto.randomUUID();

			const profile = await db
				.select()
				.from(userProfile)
				.where(eq(userProfile.userId, ctx.session.user.id))
				.limit(1);

			const level = profile[0]?.level ?? "beginner";

			const scenarioName =
				input.scenarioName ?? input.scenario.replace(/-/g, " ");
			const scenarioDescription =
				input.scenarioDescription ??
				`Practice English through a ${scenarioName} conversation`;
			const aiRole = input.aiRole ?? "conversation partner";
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
				userId: ctx.session.user.id,
				scenario: input.scenarioName ?? "",
				level: level,
				context: {
					systemPrompt,
					scenarioDescription,
					goals,
					scenarioType: input.scenarioType,
					aiRole,
				},
				status: "active",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			await db.insert(conversationSession).values(newSession);

			recordActivity(ctx.session.user.id, "conversation").catch(console.error);

			const messageId = crypto.randomUUID();
			await db.insert(conversationMessage).values({
				id: messageId,
				sessionId,
				role: "assistant",
				content: greeting,
				createdAt: new Date(),
			});

			return {
				sessionId,
				scenario: {
					id: input.scenario,
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

			return {
				session: session[0],
				messages,
			};
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

			// Get conversation history for context
			const _history = await db
				.select()
				.from(conversationMessage)
				.where(eq(conversationMessage.sessionId, input.sessionId))
				.orderBy(conversationMessage.createdAt);

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
