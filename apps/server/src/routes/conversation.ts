import { PutObjectCommand } from "@aws-sdk/client-s3";
import { recordActivity } from "@english.now/api/services/record-activity";
import { auth } from "@english.now/auth";
import {
	conversationFeedback,
	conversationMessage,
	conversationSession,
	db,
	eq,
	userProfile,
} from "@english.now/db";
import { env } from "@english.now/env/server";
import { generateText, Output } from "ai";
import type { Context, Next } from "hono";
import { Hono } from "hono";
import { streamText } from "hono/streaming";
import { z } from "zod";
import { rateLimit } from "@/middleware/rate-limit";
import { enqueueGenerateConversationFeedback } from "../jobs";
import { generateTTSBase64 } from "../services/tts";
import { openai } from "../utils/ai";
import { getQueue } from "../utils/queue";
import s3Client from "../utils/r2";

type Variables = {
	session: Awaited<ReturnType<typeof auth.api.getSession>>;
};

const conversation = new Hono<{ Variables: Variables }>();

// Schema for send message request
const sendMessageSchema = z.object({
	sessionId: z.string(),
	content: z.string().min(1).max(2000),
	inputType: z.enum(["text", "voice"]).default("text"),
	audioUrl: z.string().optional(),
});

// Schema for transcribe request (Deepgram integration)
const transcribeSchema = z.object({
	audio: z.string(), // base64 encoded audio
	sessionId: z.string(),
});

// Schema for TTS request
const speakSchema = z.object({
	text: z.string().min(1).max(5000),
	voice: z.string().default("aura-asteria-en"), // Deepgram voice model
});

// Middleware to check auth
const requireAuth = async (
	c: Context<{ Variables: Variables }>,
	next: Next,
) => {
	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	c.set("session", session);
	return next();
};

// Start a new conversation session
conversation.post("/start", requireAuth, async (c) => {
	const session = c.get("session");
	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	const body = await c.req.json();

	const { scenario, scenarioName, scenarioDescription, aiRole } = z
		.object({
			scenario: z.string(),
			scenarioName: z.string().optional(),
			scenarioDescription: z.string().optional(),
			aiRole: z.string().optional(),
		})
		.parse(body);

	const sessionId = crypto.randomUUID();

	const profile = await db
		.select()
		.from(userProfile)
		.where(eq(userProfile.userId, session.user.id))
		.limit(1);

	const level = profile[0]?.level ?? "beginner";
	const voiceModel = profile[0]?.voiceModel ?? "aura-2-thalia-en";
	console.log("voiceModel", voiceModel);

	const finalName = scenarioName ?? scenario.replace(/-/g, " ");
	const finalDescription =
		scenarioDescription ??
		`Practice English through a ${finalName} conversation`;
	const role = aiRole ?? "conversation partner";
	const finalSystemPrompt = `You are a ${role} in a ${finalName} scenario. ${finalDescription}.
The person you're talking to is learning English at a ${level} level.
- Keep your language appropriate for their level
- Be encouraging and supportive
- After they respond, provide helpful corrections for any grammar or vocabulary mistakes
- Ask follow-up questions to keep the conversation flowing
- Use natural, authentic language for this scenario`;
	const greeting = generateDynamicGreeting(finalName, role, level);

	await db.insert(conversationSession).values({
		id: sessionId,
		userId: session.user.id,
		scenario: scenarioName ?? scenario,
		level,
		context: {
			systemPrompt: finalSystemPrompt,
			scenarioDescription: finalDescription,
			goals: [],
		},
		status: "active",
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	// Save initial AI greeting
	const messageId = crypto.randomUUID();
	await db.insert(conversationMessage).values({
		id: messageId,
		sessionId,
		role: "assistant",
		content: greeting,
		createdAt: new Date(),
	});

	recordActivity(session.user.id, "conversation").catch(console.error);

	// Generate TTS for the initial greeting
	const greetingAudio = await generateTTSBase64(greeting, voiceModel);

	return c.json({
		sessionId,
		scenario: {
			id: scenario,
			name: finalName,
			description: finalDescription,
		},
		level,
		initialMessage: {
			id: messageId,
			role: "assistant",
			content: greeting,
			audio: greetingAudio,
		},
	});
});

// Send message and stream AI response
conversation.post(
	"/send",
	requireAuth,
	rateLimit({ max: 20, windowMs: 60_000 }),
	async (c) => {
		const session = c.get("session");
		if (!session) {
			return c.json({ error: "Unauthorized" }, 401);
		}
		const body = await c.req.json();
		const input = sendMessageSchema.parse(body);

		// Verify session belongs to user
		const conversationSessionResult = await db
			.select()
			.from(conversationSession)
			.where(eq(conversationSession.id, input.sessionId))
			.limit(1);

		const sessionData = conversationSessionResult[0];
		if (!sessionData || sessionData.userId !== session.user.id) {
			return c.json({ error: "Session not found" }, 404);
		}

		// Save user message
		const userMessageId = crypto.randomUUID();
		await db.insert(conversationMessage).values({
			id: userMessageId,
			sessionId: input.sessionId,
			role: "user",
			content: input.content,
			audioUrl: input.audioUrl,
			metadata: { transcribedFrom: input.inputType },
			createdAt: new Date(),
		});

		// Get conversation history
		const history = await db
			.select()
			.from(conversationMessage)
			.where(eq(conversationMessage.sessionId, input.sessionId))
			.orderBy(conversationMessage.createdAt);

		// Build messages for AI
		const context = sessionData.context as {
			systemPrompt: string;
			scenarioDescription: string;
		} | null;

		const messages = [
			{
				role: "system" as const,
				content:
					context?.systemPrompt || getDefaultSystemPrompt(sessionData.level),
			},
			...history.map((m) => ({
				role: m.role as "user" | "assistant",
				content: m.content,
			})),
		];

		// Stream AI response
		return streamText(c, async (stream) => {
			const aiMessageId = crypto.randomUUID();
			let fullResponse = "";

			try {
				// Use OpenAI for real response
				const response = await fetch(
					"https://api.openai.com/v1/chat/completions",
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${env.OPENAI_API_KEY}`,
						},
						body: JSON.stringify({
							model: "gpt-4o-mini",
							messages,
							stream: true,
							max_tokens: 500,
							temperature: 0.7,
						}),
					},
				);

				if (!response.ok) {
					throw new Error(`OpenAI API error: ${response.statusText}`);
				}

				const reader = response.body?.getReader();
				const decoder = new TextDecoder();

				if (!reader) {
					throw new Error("No response body");
				}

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value);
					const lines = chunk.split("\n").filter((line) => line.trim() !== "");

					for (const line of lines) {
						if (line.startsWith("data: ")) {
							const data = line.slice(6);
							if (data === "[DONE]") continue;

							try {
								const parsed = JSON.parse(data);
								const content = parsed.choices?.[0]?.delta?.content;
								if (content) {
									await stream.write(content);
									fullResponse += content;
								}
							} catch {
								// Skip malformed JSON
							}
						}
					}
				}

				// Save AI response to database
				await db.insert(conversationMessage).values({
					id: aiMessageId,
					sessionId: input.sessionId,
					role: "assistant",
					content: fullResponse,
					corrections: extractCorrections(input.content, fullResponse),
					createdAt: new Date(),
				});

				// Update session timestamp
				await db
					.update(conversationSession)
					.set({ updatedAt: new Date() })
					.where(eq(conversationSession.id, input.sessionId));

				// Generate TTS audio for the assistant response
				if (fullResponse.trim()) {
					const audioBase64 = await generateTTSBase64(fullResponse);
					if (audioBase64) {
						// Send a special delimiter followed by audio data
						// Format: \n__TTS_AUDIO__<base64_audio_data>
						await stream.write(`\n__TTS_AUDIO__${audioBase64}`);
					}
				}
			} catch (error) {
				console.error("Error generating AI response:", error);
				const errorMessage =
					"I apologize, but I'm having trouble responding right now. Please try again.";
				await stream.write(errorMessage);
			}
		});
	},
);

// Text-to-speech using Deepgram
conversation.post(
	"/speak",
	requireAuth,
	rateLimit({ max: 20, windowMs: 60_000 }),
	async (c) => {
		const body = await c.req.json();
		const { text, voice } = speakSchema.parse(body);

		try {
			const audioBase64 = await generateTTSBase64(text, voice);

			if (!audioBase64) {
				return c.json({ error: "Failed to generate speech" }, 500);
			}

			return c.json({
				audio: audioBase64,
				contentType: "audio/mp3",
			});
		} catch (error) {
			console.error("TTS error:", error);
			return c.json({ error: "Failed to generate speech" }, 500);
		}
	},
);

// Transcribe audio using Deepgram, then persist the recording in R2
conversation.post("/transcribe", requireAuth, async (c) => {
	const session = c.get("session");
	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const body = await c.req.json();
	const { audio, sessionId } = transcribeSchema.parse(body);

	try {
		const audioBuffer = Buffer.from(audio, "base64");

		// Send to Deepgram for transcription
		const response = await fetch(
			"https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en",
			{
				method: "POST",
				headers: {
					Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
					"Content-Type": "audio/webm",
				},
				body: audioBuffer,
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			console.error("Deepgram error:", errorText);
			throw new Error(`Deepgram API error: ${response.statusText}`);
		}

		const result = (await response.json()) as {
			results?: {
				channels?: Array<{
					alternatives?: Array<{
						transcript?: string;
						confidence?: number;
					}>;
				}>;
			};
		};
		const transcript =
			result.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

		// Upload the raw audio to R2 for later feedback analysis
		let audioUrl: string | undefined;
		try {
			const messageId = crypto.randomUUID();
			const key = `${session.user.id}/${sessionId}/${messageId}.webm`;

			await s3Client.send(
				new PutObjectCommand({
					Bucket: "_audio",
					Key: key,
					Body: audioBuffer,
					ContentType: "audio/webm",
				}),
			);

			audioUrl = `${env.R2_PUBLIC_URL}/_audio/${key}`;
		} catch (uploadError) {
			console.error("R2 audio upload error:", uploadError);
		}

		return c.json({
			transcript,
			confidence:
				result.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0,
			audioUrl,
		});
	} catch (error) {
		console.error("Transcription error:", error);
		return c.json({ error: "Failed to transcribe audio" }, 500);
	}
});

// Generate a contextual hint (what to say next)
conversation.post("/hint", requireAuth, async (c) => {
	const session = c.get("session");
	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const body = await c.req.json();
	const { sessionId } = z.object({ sessionId: z.string() }).parse(body);

	const conversationSessionResult = await db
		.select()
		.from(conversationSession)
		.where(eq(conversationSession.id, sessionId))
		.limit(1);

	const sessionData = conversationSessionResult[0];
	if (!sessionData || sessionData.userId !== session.user.id) {
		return c.json({ error: "Session not found" }, 404);
	}

	const profile = await db
		.select()
		.from(userProfile)
		.where(eq(userProfile.userId, session.user.id))
		.limit(1);

	const nativeLanguage = profile[0]?.nativeLanguage ?? "Spanish";
	const level = sessionData.level ?? "beginner";

	const history = await db
		.select()
		.from(conversationMessage)
		.where(eq(conversationMessage.sessionId, sessionId))
		.orderBy(conversationMessage.createdAt);

	const conversationHistory = history
		.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
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

	const suggestions = (output ?? "")
		.split("\n")
		.map((l) => l.replace(/^•\s*/, "").trim())
		.filter(Boolean);

	return c.json({ suggestions });
});

// Translate from user's native language to English
conversation.post("/native-to-english", requireAuth, async (c) => {
	const session = c.get("session");
	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const body = await c.req.json();
	const { text } = z.object({ text: z.string().min(1).max(5000) }).parse(body);

	const profile = await db
		.select()
		.from(userProfile)
		.where(eq(userProfile.userId, session.user.id))
		.limit(1);

	const nativeLanguage = profile[0]?.nativeLanguage ?? "Spanish";

	const { output } = await generateText({
		model: openai("gpt-4o-mini"),
		output: Output.text(),
		system: `You are a translation assistant for English learners whose native language is ${nativeLanguage}.
The user will write something in ${nativeLanguage}. Translate it to natural, conversational English.
Return ONLY the English translation, nothing else. No quotes, no explanations.`,
		prompt: text,
		temperature: 0.3,
	});

	if (!output) {
		return c.json({ error: "Translation failed" }, 500);
	}

	return c.json({ english: output.trim() });
});

// Finish a conversation session and enqueue feedback generation
conversation.post("/finish", requireAuth, async (c) => {
	const session = c.get("session");
	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const body = await c.req.json();
	const { sessionId } = z.object({ sessionId: z.string() }).parse(body);

	const sessionResult = await db
		.select()
		.from(conversationSession)
		.where(eq(conversationSession.id, sessionId))
		.limit(1);

	const sessionData = sessionResult[0];
	if (!sessionData || sessionData.userId !== session.user.id) {
		return c.json({ error: "Session not found" }, 404);
	}

	if (sessionData.status === "completed") {
		const existing = await db
			.select()
			.from(conversationFeedback)
			.where(eq(conversationFeedback.sessionId, sessionId))
			.limit(1);

		if (existing[0]) {
			return c.json({
				feedbackId: existing[0].id,
				status: existing[0].status,
			});
		}
	}

	const messages = await db
		.select()
		.from(conversationMessage)
		.where(eq(conversationMessage.sessionId, sessionId));

	const userMessageCount = messages.filter((m) => m.role === "user").length;

	if (userMessageCount < 3) {
		await db
			.update(conversationSession)
			.set({ status: "completed", updatedAt: new Date() })
			.where(eq(conversationSession.id, sessionId));

		return c.json({
			canGenerateFeedback: false,
			userMessageCount,
		});
	}

	await db
		.update(conversationSession)
		.set({ status: "completed", updatedAt: new Date() })
		.where(eq(conversationSession.id, sessionId));

	const feedbackId = crypto.randomUUID();
	await db.insert(conversationFeedback).values({
		id: feedbackId,
		sessionId,
		userId: session.user.id,
		status: "generating",
		createdAt: new Date(),
	});

	const boss = getQueue();
	await enqueueGenerateConversationFeedback(boss, {
		sessionId,
		userId: session.user.id,
	});

	return c.json({
		canGenerateFeedback: true,
		feedbackId,
		status: "generating",
	});
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

function getDefaultSystemPrompt(level: string): string {
	return `You are a friendly English conversation partner helping someone practice English at a ${level} level. Be encouraging, keep the conversation going, and gently correct any grammar or vocabulary mistakes. When correcting, do so naturally within your response.`;
}

function extractCorrections(
	_userMessage: string,
	_aiResponse: string,
): Array<{
	original: string;
	corrected: string;
	explanation: string;
	type: "grammar" | "vocabulary" | "pronunciation" | "fluency";
}> | null {
	// Simple extraction - in production, this would use AI to extract corrections
	// For now, return null - corrections will be embedded in the AI response
	return null;
}

export default conversation;
