import { storage } from "@english.now/api/lib/storage";
import {
	buildCallInstructions,
	CALL_REALTIME_MODEL,
	CALL_TRANSCRIPTION_MODEL,
	CALL_TUTORS,
	getCallMaxSeconds,
	getCallTutor,
} from "@english.now/api/services/call-tutors";
import { buildDefaultConversationGoals } from "@english.now/api/services/conversation-mode";
import { consumePracticeSession } from "@english.now/api/services/feature-gating";
import { auth } from "@english.now/auth";
import {
	type ConversationPhoneCallModeConfig,
	type ConversationSession,
	type ConversationSessionContext,
	conversationMessage,
	conversationSession,
	db,
	eq,
	sql,
	userProfile,
} from "@english.now/db";
import { env } from "@english.now/env/server";
import type { Context, Next } from "hono";
import { Hono } from "hono";
import { z } from "zod";
import { rateLimit } from "@/middleware/rate-limit";

type Variables = {
	session: Awaited<ReturnType<typeof auth.api.getSession>>;
};

const call = new Hono<{ Variables: Variables }>();

const CLIENT_SECRET_TTL_SECONDS = 120;
const MIN_CONNECT_SECONDS = 5;
const MAX_TURNS_PER_CALL = 400;
const MAX_TURN_AUDIO_BYTES = 2 * 1024 * 1024;
const RESUME_CONTEXT_TURNS = 12;

const startCallSchema = z.object({
	tutorId: z.string().min(1).max(40),
	topic: z.string().trim().min(1).max(120).nullish(),
});

const connectCallSchema = z.object({
	sessionId: z.string().min(1),
});

const turnSchema = z.object({
	sessionId: z.string().min(1),
	role: z.enum(["user", "assistant"]),
	content: z.string().trim().min(1).max(2000),
	startedAt: z.coerce.number().int().positive().optional(),
});

const clientSecretResponseSchema = z.object({
	value: z.string(),
	expires_at: z.number(),
});

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

function getPhoneCallModeConfig(
	session: Pick<ConversationSession, "mode" | "context">,
): ConversationPhoneCallModeConfig | null {
	if (session.mode !== "phone-call") return null;
	const modeConfig = session.context?.modeConfig;
	return modeConfig?.kind === "phone-call" ? modeConfig : null;
}

async function getOwnedCallSession(sessionId: string, userId: string) {
	const [sessionData] = await db
		.select()
		.from(conversationSession)
		.where(eq(conversationSession.id, sessionId))
		.limit(1);

	if (!sessionData || sessionData.userId !== userId) return null;

	const modeConfig = getPhoneCallModeConfig(sessionData);
	if (!modeConfig || !sessionData.context) return null;

	return { sessionData, modeConfig, context: sessionData.context };
}

function isWavBuffer(buffer: Buffer) {
	return (
		buffer.length > 44 &&
		buffer.toString("ascii", 0, 4) === "RIFF" &&
		buffer.toString("ascii", 8, 12) === "WAVE"
	);
}

function buildResumeInstructions(
	history: Array<{ role: string; content: string }>,
) {
	if (history.length === 0) return "";

	const transcript = history
		.slice(-RESUME_CONTEXT_TURNS)
		.map(
			(message) =>
				`${message.role === "user" ? "Learner" : "You"}: ${message.content}`,
		)
		.join("\n");

	return [
		"",
		"# The call so far",
		"The call dropped and has just reconnected. Here is the end of the conversation so far:",
		transcript,
		"When the call reconnects, briefly say you got cut off and continue the conversation naturally. Do not repeat your usual greeting.",
	].join("\n");
}

call.post(
	"/session",
	requireAuth,
	rateLimit({ max: 10, windowMs: 60_000 }),
	async (c) => {
		const session = c.get("session");
		if (!session) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const parsed = startCallSchema.safeParse(await c.req.json());
		if (!parsed.success) {
			return c.json({ error: "Invalid request" }, 400);
		}

		const tutor = CALL_TUTORS.find((item) => item.id === parsed.data.tutorId);
		if (!tutor) {
			return c.json({ error: "Tutor not found" }, 404);
		}

		const userId = session.user.id;
		const sessionId = crypto.randomUUID();
		const { consumed, access } = await consumePracticeSession(
			userId,
			"conversation_session",
			{
				resourceId: sessionId,
				metadata: { mode: "phone-call", tutorId: tutor.id },
			},
		);
		if (!consumed) {
			return c.json({ error: "FREE_WEEKLY_PRACTICE_LIMIT_REACHED" }, 403);
		}

		const [profile] = await db
			.select({ level: userProfile.level })
			.from(userProfile)
			.where(eq(userProfile.userId, userId))
			.limit(1);

		const level = profile?.level ?? "beginner";
		const topic = parsed.data.topic ?? null;
		const maxSeconds = getCallMaxSeconds(access.isPro);
		const title = `Call with ${tutor.name}`;
		const subtitle = topic ? `Topic: ${topic}` : tutor.tagline;
		const systemPrompt = buildCallInstructions({
			tutor,
			level,
			topic,
			learnerName: session.user.name,
		});

		const context: ConversationSessionContext = {
			mode: "phone-call",
			display: { title, subtitle },
			goals: buildDefaultConversationGoals({ mode: "phone-call", title }),
			participants: { aiRole: tutor.name },
			modeConfig: {
				kind: "phone-call",
				tutorId: tutor.id,
				topic,
				maxSeconds,
				connectedAt: null,
			},
			systemPrompt,
			scenarioDescription: subtitle,
			scenarioType: "topic",
			aiRole: tutor.name,
		};

		const now = new Date();
		await db.insert(conversationSession).values({
			id: sessionId,
			userId,
			scenario: title,
			mode: "phone-call",
			level,
			context,
			status: "active",
			createdAt: now,
			updatedAt: now,
		});

		return c.json({ sessionId, maxSeconds });
	},
);

call.post(
	"/connect",
	requireAuth,
	rateLimit({ max: 10, windowMs: 60_000 }),
	async (c) => {
		const session = c.get("session");
		if (!session) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const parsed = connectCallSchema.safeParse(await c.req.json());
		if (!parsed.success) {
			return c.json({ error: "Invalid request" }, 400);
		}

		const owned = await getOwnedCallSession(
			parsed.data.sessionId,
			session.user.id,
		);
		if (!owned) {
			return c.json({ error: "Session not found" }, 404);
		}

		const { sessionData, modeConfig, context } = owned;
		if (sessionData.status !== "active") {
			return c.json({ error: "CALL_ENDED" }, 409);
		}

		const now = new Date();
		const connectedAt = modeConfig.connectedAt
			? new Date(modeConfig.connectedAt)
			: now;
		const elapsedSeconds = (now.getTime() - connectedAt.getTime()) / 1000;
		const remainingSeconds = Math.floor(modeConfig.maxSeconds - elapsedSeconds);

		if (remainingSeconds < MIN_CONNECT_SECONDS) {
			return c.json({ error: "CALL_TIME_EXPIRED" }, 409);
		}

		const history = modeConfig.connectedAt
			? await db
					.select({
						role: conversationMessage.role,
						content: conversationMessage.content,
					})
					.from(conversationMessage)
					.where(eq(conversationMessage.sessionId, sessionData.id))
					.orderBy(conversationMessage.createdAt)
			: [];
		const tutor = getCallTutor(modeConfig.tutorId);
		const instructions = `${context.systemPrompt}${buildResumeInstructions(history)}`;

		const response = await fetch(
			"https://api.openai.com/v1/realtime/client_secrets",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${env.OPENAI_API_KEY}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					expires_after: {
						anchor: "created_at",
						seconds: CLIENT_SECRET_TTL_SECONDS,
					},
					session: {
						type: "realtime",
						model: CALL_REALTIME_MODEL,
						instructions,
						max_output_tokens: 400,
						audio: {
							input: {
								noise_reduction: { type: "near_field" },
								transcription: {
									model: CALL_TRANSCRIPTION_MODEL,
									language: "en",
								},
								turn_detection: {
									type: "semantic_vad",
									eagerness: "low",
									create_response: true,
									interrupt_response: true,
								},
							},
							output: {
								voice: tutor.voice,
								speed: tutor.speed,
							},
						},
					},
				}),
			},
		);

		if (!response.ok) {
			console.error(
				"[call] Failed to create realtime client secret:",
				response.status,
				await response.text(),
			);
			return c.json({ error: "REALTIME_UNAVAILABLE" }, 502);
		}

		const secret = clientSecretResponseSchema.safeParse(await response.json());
		if (!secret.success) {
			console.error("[call] Unexpected client secret response");
			return c.json({ error: "REALTIME_UNAVAILABLE" }, 502);
		}

		if (!modeConfig.connectedAt) {
			await db
				.update(conversationSession)
				.set({
					context: {
						...context,
						modeConfig: { ...modeConfig, connectedAt: now.toISOString() },
					},
					updatedAt: now,
				})
				.where(eq(conversationSession.id, sessionData.id));
		}

		return c.json({
			clientSecret: secret.data.value,
			expiresAt: secret.data.expires_at,
			model: CALL_REALTIME_MODEL,
			tutorId: tutor.id,
			maxSeconds: modeConfig.maxSeconds,
			remainingSeconds,
			resumed: history.length > 0,
		});
	},
);

call.post(
	"/turn",
	requireAuth,
	rateLimit({ max: 120, windowMs: 60_000 }),
	async (c) => {
		const session = c.get("session");
		if (!session) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const formData = await c.req.formData();
		const parsed = turnSchema.safeParse({
			sessionId: formData.get("sessionId"),
			role: formData.get("role"),
			content: formData.get("content"),
			startedAt: formData.get("startedAt") ?? undefined,
		});
		if (!parsed.success) {
			return c.json({ error: "Invalid request" }, 400);
		}

		const input = parsed.data;
		const owned = await getOwnedCallSession(input.sessionId, session.user.id);
		if (!owned) {
			return c.json({ error: "Session not found" }, 404);
		}

		if (owned.sessionData.status !== "active") {
			return c.json({ error: "CALL_ENDED" }, 409);
		}

		const [turnCount] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(conversationMessage)
			.where(eq(conversationMessage.sessionId, input.sessionId));
		if ((turnCount?.count ?? 0) >= MAX_TURNS_PER_CALL) {
			return c.json({ error: "TURN_LIMIT_REACHED" }, 409);
		}

		const now = new Date();
		const sessionStart = owned.sessionData.createdAt.getTime();
		const createdAt = new Date(
			Math.min(
				now.getTime(),
				Math.max(sessionStart, input.startedAt ?? now.getTime()),
			),
		);

		const messageId = crypto.randomUUID();
		let audioUrl: string | undefined;
		const audioEntry = formData.get("audio");

		if (
			input.role === "user" &&
			audioEntry &&
			typeof audioEntry !== "string" &&
			audioEntry.size <= MAX_TURN_AUDIO_BYTES
		) {
			const audioBuffer = Buffer.from(await audioEntry.arrayBuffer());

			if (isWavBuffer(audioBuffer)) {
				try {
					const key = `${session.user.id}/${input.sessionId}/${messageId}.wav`;
					audioUrl = await storage.put("audio", key, audioBuffer, "audio/wav");
				} catch (error) {
					console.error("[call] audio upload error:", error);
				}
			}
		}

		await db.insert(conversationMessage).values({
			id: messageId,
			sessionId: input.sessionId,
			role: input.role,
			content: input.content,
			audioUrl,
			metadata: input.role === "user" ? { transcribedFrom: "voice" } : null,
			createdAt,
		});

		await db
			.update(conversationSession)
			.set({ updatedAt: now })
			.where(eq(conversationSession.id, input.sessionId));

		return c.json({ id: messageId });
	},
);

export default call;
