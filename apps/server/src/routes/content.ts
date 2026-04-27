import { auth } from "@english.now/auth";
import type { Context, Next } from "hono";
import { Hono } from "hono";
import { enrollUser } from "../services/enroll-user";

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

content.post("/generate", requireAuth, async (c) => {
	const session = c.get("session");
	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const userId = session.user.id;

	try {
		const { enrollmentId } = await enrollUser(userId);
		return c.json({ status: "enrolled", enrollmentId });
	} catch (error) {
		return c.json(
			{
				error: error instanceof Error ? error.message : "Enrollment failed",
			},
			500,
		);
	}
});

export default content;
