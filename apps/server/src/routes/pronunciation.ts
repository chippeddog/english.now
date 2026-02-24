import { PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@english.now/auth";
import {
	and,
	db,
	eq,
	pronunciationAttempt,
	pronunciationSession,
} from "@english.now/db";
import { env } from "@english.now/env/server";
import type { Context, Next } from "hono";
import { Hono } from "hono";
import { z } from "zod";
import {
	enqueueGeneratePronunciationFeedback,
	enqueueProcessPronunciationSession,
} from "../jobs";
import { assessPronunciation } from "../services/pronunciation-assessment";
import { generateTTS } from "../services/tts";
import { getQueue } from "../utils/queue";
import s3Client from "../utils/r2";

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

const assessSchema = z.object({
	audio: z.string().min(1),
	referenceText: z.string().min(1),
});

pronunciation.post("/assess", requireAuth, async (c) => {
	const session = c.get("session");
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const body = await c.req.json();
	const { audio, referenceText } = assessSchema.parse(body);

	try {
		const audioBuffer = Buffer.from(audio, "base64");

		const key = `/${session.user.id}/${Date.now()}.webm`;
		const uploadPromise = s3Client
			.send(
				new PutObjectCommand({
					Bucket: "_audio",
					Key: key,
					Body: audioBuffer,
					ContentType: "audio/webm",
				}),
			)
			.then(() => `${env.R2_PUBLIC_URL}/_audio/${key}`)
			.catch((err) => {
				console.error("R2 pronunciation audio upload error:", err);
				return undefined;
			});

		const [result, audioUrl] = await Promise.all([
			assessPronunciation(audioBuffer, referenceText),
			uploadPromise,
		]);

		return c.json({ ...result, audioUrl });
	} catch (error) {
		console.error("Pronunciation assessment error:", error);
		return c.json(
			{
				error: "Failed to assess pronunciation",
				details: error instanceof Error ? error.message : String(error),
			},
			500,
		);
	}
});

pronunciation.post("/upload", requireAuth, async (c) => {
	const session = c.get("session");
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const body = await c.req.json();
	const { audio, sessionId } = z
		.object({ audio: z.string().min(1), sessionId: z.string().min(1) })
		.parse(body);

	try {
		const audioBuffer = Buffer.from(audio, "base64");
		const key = `${session.user.id}/${sessionId}/${Date.now()}.webm`;

		await s3Client.send(
			new PutObjectCommand({
				Bucket: "_audio",
				Key: key,
				Body: audioBuffer,
				ContentType: "audio/webm",
			}),
		);

		const audioUrl = `${env.R2_PUBLIC_URL}/_audio/${key}`;
		return c.json({ audioUrl });
	} catch (error) {
		console.error("Audio upload error:", error);
		return c.json({ error: "Failed to upload audio" }, 500);
	}
});

pronunciation.post("/assess-and-complete", requireAuth, async (c) => {
	const session = c.get("session");
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const body = await c.req.json();
	const { sessionId } = z.object({ sessionId: z.string() }).parse(body);

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

	const boss = getQueue();
	await enqueueProcessPronunciationSession(boss, {
		sessionId,
		userId: session.user.id,
	});

	return c.json({ ok: true, sessionId });
});

const ttsSchema = z.object({
	text: z.string().min(1).max(5000),
});

pronunciation.post("/tts", requireAuth, async (c) => {
	const body = await c.req.json();
	const { text } = ttsSchema.parse(body);

	try {
		const audioBuffer = await generateTTS(text);

		if (!audioBuffer) {
			return c.json({ error: "Failed to generate speech" }, 500);
		}

		return new Response(audioBuffer, {
			headers: {
				"Content-Type": "audio/mp3",
				"Content-Length": audioBuffer.length.toString(),
			},
		});
	} catch (error) {
		console.error("TTS error:", error);
		return c.json({ error: "Failed to generate speech" }, 500);
	}
});

pronunciation.post("/enqueue-feedback", requireAuth, async (c) => {
	const session = c.get("session");
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const body = await c.req.json();
	const { sessionId } = z.object({ sessionId: z.string() }).parse(body);

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
