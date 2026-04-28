import { PutObjectCommand } from "@aws-sdk/client-s3";
import {
	buildConversationSessionFromActivity,
	buildFallbackConversationSystemPrompt,
} from "@english.now/api/services/conversation-prompt";
import {
	getTodayPracticePlanRecord,
	markDailyPracticeActivityCompleted,
	markDailyPracticeActivityStarted,
} from "@english.now/api/services/daily-practice-plan";
import {
	getConversationAccessSummary,
	getConversationReplyAccessSummary,
	getVocabularyAccessSummary,
} from "@english.now/api/services/feature-gating";
import { recordDailyFeatureUsage } from "@english.now/api/services/feature-usage";
import { recordActivity } from "@english.now/api/services/record-activity";
import { auth } from "@english.now/auth";
import {
	conversationMessage,
	conversationSession,
	db,
	eq,
	userProfile,
} from "@english.now/db";
import { env } from "@english.now/env/server";
import { FREE_CONVERSATION_MAX_AI_REPLIES } from "@english.now/shared/feature-limit-config";
import { generateText, Output } from "ai";
import type { Context, Next } from "hono";
import { Hono } from "hono";
import { streamText } from "hono/streaming";
import { z } from "zod";
import { rateLimit } from "@/middleware/rate-limit";
import {
	enqueueAddConversationVocabulary,
	enqueueGenerateConversationFeedback,
} from "../jobs";
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

// Schema for legacy JSON transcribe request (Deepgram integration)
const transcribeJsonSchema = z.object({
	audio: z.string(), // base64 encoded audio
	sessionId: z.string(),
	mimeType: z.string().optional(),
});

// Schema for TTS request
const speakSchema = z.object({
	text: z.string().min(1).max(5000),
	voice: z.string().default("aura-asteria-en"), // Deepgram voice model
});

const enqueueConversationVocabularySchema = z.object({
	sessionId: z.string(),
	text: z.string().min(1).max(300),
	mode: z.enum(["word", "phrase"]),
});

function getSseEventData(event: string) {
	const data = event
		.split("\n")
		.filter((line) => line.startsWith("data: "))
		.map((line) => line.slice(6))
		.join("\n");

	return data.trim();
}

function normalizeAudioMimeType(mimeType?: string) {
	const normalized = mimeType?.split(";")[0]?.trim().toLowerCase();

	switch (normalized) {
		case "audio/mp4":
		case "audio/m4a":
		case "audio/x-m4a":
		case "video/mp4":
			return "audio/mp4";
		case "audio/webm":
		case "video/webm":
			return "audio/webm";
		case "audio/ogg":
			return "audio/ogg";
		case "audio/wav":
		case "audio/wave":
		case "audio/x-wav":
			return "audio/wav";
		case "audio/mpeg":
		case "audio/mp3":
			return "audio/mpeg";
		case "audio/aac":
			return "audio/aac";
		default:
			return undefined;
	}
}

function inferAudioMimeType(audioBuffer: Buffer, mimeType?: string) {
	const normalizedMimeType = normalizeAudioMimeType(mimeType);
	if (normalizedMimeType) return normalizedMimeType;

	if (
		audioBuffer.length >= 12 &&
		audioBuffer.toString("ascii", 4, 8) === "ftyp"
	) {
		return "audio/mp4";
	}

	if (
		audioBuffer.length >= 4 &&
		audioBuffer[0] === 0x1a &&
		audioBuffer[1] === 0x45 &&
		audioBuffer[2] === 0xdf &&
		audioBuffer[3] === 0xa3
	) {
		return "audio/webm";
	}

	if (
		audioBuffer.length >= 12 &&
		audioBuffer.toString("ascii", 0, 4) === "RIFF" &&
		audioBuffer.toString("ascii", 8, 12) === "WAVE"
	) {
		return "audio/wav";
	}

	if (
		audioBuffer.length >= 4 &&
		audioBuffer.toString("ascii", 0, 4) === "OggS"
	) {
		return "audio/ogg";
	}

	if (
		audioBuffer.length >= 3 &&
		audioBuffer.toString("ascii", 0, 3) === "ID3"
	) {
		return "audio/mpeg";
	}

	return "audio/webm";
}

function getAudioFileExtension(mimeType: string) {
	switch (mimeType) {
		case "audio/mp4":
			return "mp4";
		case "audio/webm":
			return "webm";
		case "audio/ogg":
			return "ogg";
		case "audio/wav":
		case "audio/wave":
		case "audio/x-wav":
			return "wav";
		case "audio/mpeg":
			return "mp3";
		case "audio/aac":
			return "aac";
		default:
			return "bin";
	}
}

async function parseTranscribeRequest(c: Context<{ Variables: Variables }>) {
	const contentType = c.req.header("content-type") ?? "";

	if (contentType.includes("multipart/form-data")) {
		const formData = await c.req.formData();
		const sessionId = z.string().min(1).parse(formData.get("sessionId"));
		const audioEntry = formData.get("audio");

		if (!audioEntry || typeof audioEntry === "string") {
			throw new Error("Missing audio file");
		}

		const requestedMimeType = formData.get("mimeType");
		const audioBuffer = Buffer.from(await audioEntry.arrayBuffer());
		const mimeType = inferAudioMimeType(
			audioBuffer,
			typeof requestedMimeType === "string" && requestedMimeType
				? requestedMimeType
				: audioEntry.type,
		);

		return {
			audioBuffer,
			sessionId,
			mimeType,
		};
	}

	const body = await c.req.json();
	const { audio, sessionId, mimeType } = transcribeJsonSchema.parse(body);
	const audioBuffer = Buffer.from(audio, "base64");

	return {
		audioBuffer,
		sessionId,
		mimeType: inferAudioMimeType(audioBuffer, mimeType),
	};
}

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

	const { activityId } = z
		.object({
			activityId: z.string(),
		})
		.parse(body);

	const { plan } = await getTodayPracticePlanRecord(session.user.id);

	if (!plan || plan.status !== "ready") {
		return c.json({ error: "Today's practice plan is not ready" }, 412);
	}

	const activity = plan.activities.find(
		(item) => item.id === activityId && item.type === "conversation",
	);

	if (!activity || activity.type !== "conversation") {
		return c.json({ error: "Practice activity not found" }, 404);
	}

	const access = await getConversationAccessSummary(session.user.id);

	if (!access.isPro && !access.hasAccess) {
		return c.json(
			{
				error: "FREE_WEEKLY_PRACTICE_LIMIT_REACHED",
				reason: access.reason,
				usedPracticeSessionId: access.latestResourceId,
			},
			403,
		);
	}

	const sessionId = crypto.randomUUID();

	const profile = await db
		.select()
		.from(userProfile)
		.where(eq(userProfile.userId, session.user.id))
		.limit(1);

	const level = profile[0]?.level ?? "beginner";
	const voiceModel = profile[0]?.voiceModel ?? "aura-2-thalia-en";
	console.log("voiceModel", voiceModel);
	const sessionConfig = buildConversationSessionFromActivity(activity, level);

	await db.insert(conversationSession).values({
		id: sessionId,
		userId: session.user.id,
		scenario: sessionConfig.sessionLabel,
		mode: sessionConfig.mode,
		level,
		context: sessionConfig.context,
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
		content: sessionConfig.greeting,
		createdAt: new Date(),
	});

	await markDailyPracticeActivityStarted(session.user.id, {
		activityId: activity.id,
		sessionId,
	});

	await recordDailyFeatureUsage({
		userId: session.user.id,
		feature: "conversation_session",
		resourceId: sessionId,
		metadata: {
			activityId: activity.id,
			scenario: activity.payload.scenario,
			mode: sessionConfig.mode,
		},
	});

	// Generate TTS for the initial greeting
	const greetingAudio = await generateTTSBase64(
		sessionConfig.greeting,
		voiceModel,
	);

	return c.json({
		sessionId,
		scenario: sessionConfig.scenario,
		level,
		initialMessage: {
			id: messageId,
			role: "assistant",
			content: sessionConfig.greeting,
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

		const existingMessages = await db
			.select({
				role: conversationMessage.role,
			})
			.from(conversationMessage)
			.where(eq(conversationMessage.sessionId, input.sessionId));
		const assistantReplies = existingMessages.filter(
			(message) => message.role === "assistant",
		).length;
		const replyAccess = await getConversationReplyAccessSummary(
			session.user.id,
			assistantReplies,
		);

		if (!replyAccess.isPro && replyAccess.reachedLimit) {
			return c.json(
				{
					error: "FREE_REPLY_LIMIT_REACHED",
					limit: FREE_CONVERSATION_MAX_AI_REPLIES,
					used: assistantReplies,
				},
				403,
			);
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
					context?.systemPrompt ||
					buildFallbackConversationSystemPrompt(sessionData.level),
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
							// model: "gpt-4o-mini",
							model: "gpt-4.1-mini",
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
				let sseBuffer = "";

				if (!reader) {
					throw new Error("No response body");
				}

				while (true) {
					const { done, value } = await reader.read();
					sseBuffer += decoder.decode(value ?? new Uint8Array(), {
						stream: !done,
					});
					sseBuffer = sseBuffer.replace(/\r\n/g, "\n");

					let boundaryIndex = sseBuffer.indexOf("\n\n");
					while (boundaryIndex !== -1) {
						const event = sseBuffer.slice(0, boundaryIndex);
						sseBuffer = sseBuffer.slice(boundaryIndex + 2);

						const data = getSseEventData(event);
						if (!data || data === "[DONE]") {
							boundaryIndex = sseBuffer.indexOf("\n\n");
							continue;
						}

						try {
							const parsed = JSON.parse(data);
							const content = parsed.choices?.[0]?.delta?.content;
							if (content) {
								await stream.write(content);
								fullResponse += content;
							}
						} catch {
							// Ignore malformed SSE events and keep streaming.
						}

						boundaryIndex = sseBuffer.indexOf("\n\n");
					}

					if (done) break;
				}

				const trailingData = getSseEventData(sseBuffer);
				if (trailingData && trailingData !== "[DONE]") {
					try {
						const parsed = JSON.parse(trailingData);
						const content = parsed.choices?.[0]?.delta?.content;
						if (content) {
							await stream.write(content);
							fullResponse += content;
						}
					} catch {
						// Ignore trailing malformed SSE event.
					}
				}

				// Save AI response to database
				await db.insert(conversationMessage).values({
					id: aiMessageId,
					sessionId: input.sessionId,
					role: "assistant",
					content: fullResponse,
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

	try {
		const { audioBuffer, sessionId, mimeType } =
			await parseTranscribeRequest(c);

		// Send to Deepgram for transcription
		const response = await fetch(
			"https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en",
			{
				method: "POST",
				headers: {
					Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
					"Content-Type": mimeType,
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
			const extension = getAudioFileExtension(mimeType);
			const key = `${session.user.id}/${sessionId}/${messageId}.${extension}`;

			await s3Client.send(
				new PutObjectCommand({
					Bucket: "_audio",
					Key: key,
					Body: audioBuffer,
					ContentType: mimeType,
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

conversation.post(
	"/vocabulary",
	requireAuth,
	rateLimit({ max: 20, windowMs: 60_000 }),
	async (c) => {
		const session = c.get("session");
		if (!session) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const body = await c.req.json();
		const input = enqueueConversationVocabularySchema.parse(body);

		const [sessionData] = await db
			.select({
				id: conversationSession.id,
				userId: conversationSession.userId,
			})
			.from(conversationSession)
			.where(eq(conversationSession.id, input.sessionId))
			.limit(1);

		if (!sessionData || sessionData.userId !== session.user.id) {
			return c.json({ error: "Session not found" }, 404);
		}

		const access = await getVocabularyAccessSummary(session.user.id);
		if (!access.isPro && !access.adds.hasAccess) {
			return c.json(
				{
					error: "FREE_VOCAB_ADD_LIMIT_REACHED",
					limit: access.adds.limit,
					used: access.adds.used,
				},
				403,
			);
		}

		const boss = getQueue();
		const jobId = await enqueueAddConversationVocabulary(boss, {
			sessionId: input.sessionId,
			userId: session.user.id,
			mode: input.mode,
			text: input.text,
		});

		return c.json(
			{
				status: "queued",
				jobId,
			},
			202,
		);
	},
);

// Finish a conversation session and enqueue feedback generation
conversation.post("/finish", requireAuth, async (c) => {
	const session = c.get("session");
	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const body = await c.req.json();
	const { sessionId, durationSeconds } = z
		.object({ sessionId: z.string(), durationSeconds: z.number().optional() })
		.parse(body);

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
		return c.json({
			canGenerateFeedback:
				sessionData.review?.availability !== "not_enough_messages",
			status: sessionData.reviewStatus,
		});
	}

	const messages = await db
		.select()
		.from(conversationMessage)
		.where(eq(conversationMessage.sessionId, sessionId));

	const userMessageCount = messages.filter((m) => m.role === "user").length;

	recordActivity(session.user.id, "conversation", durationSeconds).catch(
		console.error,
	);

	if (userMessageCount < 3) {
		const now = new Date();
		await db
			.update(conversationSession)
			.set({
				status: "completed",
				reviewStatus: "completed",
				reviewGeneratedAt: now,
				review: {
					availability: "not_enough_messages",
					overallScore: null,
					scores: {
						grammar: null,
						vocabulary: null,
						pronunciation: null,
					},
					problems: [],
					tasks: [],
					stats: {
						totalProblems: 0,
						totalTasks: 0,
					},
				},
				updatedAt: now,
			})
			.where(eq(conversationSession.id, sessionId));

		try {
			await markDailyPracticeActivityCompleted(session.user.id, { sessionId });
		} catch (error) {
			console.error("Failed to complete daily conversation activity:", error);
		}

		return c.json({
			canGenerateFeedback: false,
			userMessageCount,
		});
	}

	const now = new Date();
	await db
		.update(conversationSession)
		.set({
			status: "completed",
			reviewStatus: "processing",
			review: null,
			updatedAt: now,
		})
		.where(eq(conversationSession.id, sessionId));

	try {
		await markDailyPracticeActivityCompleted(session.user.id, { sessionId });
	} catch (error) {
		console.error("Failed to complete daily conversation activity:", error);
	}

	const boss = getQueue();
	await enqueueGenerateConversationFeedback(boss, {
		sessionId,
		userId: session.user.id,
	});

	return c.json({
		canGenerateFeedback: true,
		status: "processing",
	});
});

export default conversation;
