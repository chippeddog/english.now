import { storage } from "@english.now/api/lib/storage";
import { markDailyPracticeActivityCompleted } from "@english.now/api/services/daily-practice-plan";
import { recordActivity } from "@english.now/api/services/record-activity";
import { auth } from "@english.now/auth";
import {
	and,
	db,
	eq,
	pronunciationAttempt,
	pronunciationSession,
} from "@english.now/db";
import { capabilities } from "@english.now/env/server";
import type { Context, Next } from "hono";
import { Hono } from "hono";
import { z } from "zod";
import { audioBodyLimit } from "@/middleware/body-limit";
import { rateLimit } from "@/middleware/rate-limit";
import {
	enqueueGeneratePronunciationFeedback,
	enqueueProcessPronunciationSession,
} from "../jobs";
import { assessPronunciation } from "../services/pronunciation-assessment";
import { generateTTS } from "../services/tts";
import { getQueue } from "../utils/queue";

type Variables = {
	session: Awaited<ReturnType<typeof auth.api.getSession>>;
};

const pronunciation = new Hono<{ Variables: Variables }>();

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

const requireAssessment = async (
	c: Context<{ Variables: Variables }>,
	next: Next,
) => {
	if (!capabilities.pronunciationAssessment) {
		return c.json({ error: "PRONUNCIATION_ASSESSMENT_UNAVAILABLE" }, 503);
	}
	return next();
};

const assessSchema = z.object({
	audio: z.string().min(1),
	referenceText: z.string().min(1).max(2000),
});

pronunciation.post(
	"/assess",
	audioBodyLimit,
	requireAuth,
	requireAssessment,
	rateLimit({ max: 10, windowMs: 60_000 }),
	async (c) => {
		const session = c.get("session");
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		const parsed = assessSchema.safeParse(await c.req.json().catch(() => null));
		if (!parsed.success) {
			return c.json({ error: "Invalid request" }, 400);
		}
		const { audio, referenceText } = parsed.data;

		try {
			const audioBuffer = Buffer.from(audio, "base64");

			const key = `${session.user.id}/assess/${Date.now()}.webm`;
			const uploadPromise = storage
				.put("audio", key, audioBuffer, "audio/webm")
				.catch((err) => {
					console.error("Pronunciation audio upload error:", err);
					return undefined;
				});

			const [result, audioUrl] = await Promise.all([
				assessPronunciation(audioBuffer, referenceText),
				uploadPromise,
			]);

			return c.json({ ...result, audioUrl });
		} catch (error) {
			console.error("Pronunciation assessment error:", error);
			return c.json({ error: "Failed to assess pronunciation" }, 500);
		}
	},
);

pronunciation.post(
	"/upload",
	audioBodyLimit,
	requireAuth,
	rateLimit({ max: 30, windowMs: 60_000 }),
	async (c) => {
		const session = c.get("session");
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		const parsed = z
			.object({ audio: z.string().min(1), sessionId: z.string().min(1) })
			.safeParse(await c.req.json().catch(() => null));
		if (!parsed.success) {
			return c.json({ error: "Invalid request" }, 400);
		}
		const { audio, sessionId } = parsed.data;

		const [ownedSession] = await db
			.select({ id: pronunciationSession.id })
			.from(pronunciationSession)
			.where(
				and(
					eq(pronunciationSession.id, sessionId),
					eq(pronunciationSession.userId, session.user.id),
				),
			)
			.limit(1);

		if (!ownedSession) return c.json({ error: "Session not found" }, 404);

		try {
			const audioBuffer = Buffer.from(audio, "base64");
			const key = `${session.user.id}/${sessionId}/${Date.now()}.webm`;
			const audioUrl = await storage.put(
				"audio",
				key,
				audioBuffer,
				"audio/webm",
			);
			return c.json({ audioUrl });
		} catch (error) {
			console.error("Audio upload error:", error);
			return c.json({ error: "Failed to upload audio" }, 500);
		}
	},
);

pronunciation.post(
	"/assess-and-complete",
	requireAuth,
	requireAssessment,
	async (c) => {
		const session = c.get("session");
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		const parsed = z
			.object({
				sessionId: z.string(),
				durationSeconds: z.number().min(0).max(86_400).optional(),
			})
			.safeParse(await c.req.json().catch(() => null));
		if (!parsed.success) {
			return c.json({ error: "Invalid request" }, 400);
		}
		const { sessionId, durationSeconds } = parsed.data;

		const [dbSession] = await db
			.select()
			.from(pronunciationSession)
			.where(
				and(
					eq(pronunciationSession.id, sessionId),
					eq(pronunciationSession.userId, session.user.id),
				),
			)
			.limit(1);

		if (!dbSession) return c.json({ error: "Session not found" }, 404);

		if (dbSession.status === "completed" || dbSession.status === "assessing") {
			return c.json({ ok: true, skipped: true, sessionId });
		}

		const attempts = await db
			.select()
			.from(pronunciationAttempt)
			.where(eq(pronunciationAttempt.sessionId, sessionId));

		if (attempts.length === 0) {
			return c.json({ error: "No attempts found" }, 400);
		}

		await db
			.update(pronunciationSession)
			.set({ status: "assessing" })
			.where(eq(pronunciationSession.id, sessionId));

		try {
			await markDailyPracticeActivityCompleted(session.user.id, { sessionId });
		} catch (error) {
			console.error("Failed to complete daily pronunciation activity:", error);
		}

		recordActivity(session.user.id, "pronunciation", durationSeconds).catch(
			console.error,
		);

		const boss = getQueue();
		await enqueueProcessPronunciationSession(boss, {
			sessionId,
			userId: session.user.id,
		});

		return c.json({ ok: true, sessionId });
	},
);

const ttsSchema = z.object({
	text: z.string().min(1).max(5000),
});

pronunciation.post(
	"/tts",
	requireAuth,
	rateLimit({ max: 30, windowMs: 60_000 }),
	async (c) => {
		const parsed = ttsSchema.safeParse(await c.req.json().catch(() => null));
		if (!parsed.success) {
			return c.json({ error: "Invalid request" }, 400);
		}

		try {
			const audioBuffer = await generateTTS(parsed.data.text);

			if (!audioBuffer) {
				return c.json({ error: "Failed to generate speech" }, 500);
			}

			return new Response(new Uint8Array(audioBuffer), {
				headers: {
					"Content-Type": "audio/mp3",
					"Content-Length": audioBuffer.length.toString(),
				},
			});
		} catch (error) {
			console.error("TTS error:", error);
			return c.json({ error: "Failed to generate speech" }, 500);
		}
	},
);

pronunciation.post("/enqueue-feedback", requireAuth, async (c) => {
	const session = c.get("session");
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const parsed = z
		.object({ sessionId: z.string() })
		.safeParse(await c.req.json().catch(() => null));
	if (!parsed.success) {
		return c.json({ error: "Invalid request" }, 400);
	}
	const { sessionId } = parsed.data;

	const [dbSession] = await db
		.select({
			feedbackStatus: pronunciationSession.feedbackStatus,
		})
		.from(pronunciationSession)
		.where(
			and(
				eq(pronunciationSession.id, sessionId),
				eq(pronunciationSession.userId, session.user.id),
			),
		)
		.limit(1);

	if (!dbSession) return c.json({ error: "Session not found" }, 404);

	if (dbSession.feedbackStatus === "completed") {
		return c.json({ ok: true, skipped: true });
	}

	const boss = getQueue();
	await enqueueGeneratePronunciationFeedback(boss, {
		sessionId,
		userId: session.user.id,
	});

	return c.json({ ok: true });
});

export default pronunciation;
