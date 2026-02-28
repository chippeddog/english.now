import { auth } from "@english.now/auth";
import { db, eq, learningPath } from "@english.now/db";
import type { Context, Next } from "hono";
import { Hono } from "hono";
import { enqueueGenerateLearningPath } from "../jobs";
import { getQueue } from "../utils/queue";

type Variables = {
	session: Awaited<ReturnType<typeof auth.api.getSession>>;
};

const content = new Hono<{ Variables: Variables }>();

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

// POST /api/content/generate — enqueue learning path generation
content.post("/generate", requireAuth, async (c) => {
	const session = c.get("session");
	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const userId = session.user.id;

	const [existing] = await db
		.select()
		.from(learningPath)
		.where(eq(learningPath.userId, userId))
		.limit(1);

	if (existing?.status === "ready") {
		return c.json({ status: "already_exists", learningPathId: existing.id });
	}

	if (existing?.status === "generating") {
		return c.json({ status: "generating", learningPathId: existing.id });
	}

	if (existing?.status === "failed") {
		await db.delete(learningPath).where(eq(learningPath.id, existing.id));
	}

	const boss = getQueue();
	const jobId = await enqueueGenerateLearningPath(boss, { userId });

	return c.json({ status: "queued", jobId });
});

export default content;
