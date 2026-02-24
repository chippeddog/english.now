import { db, rateLimits, sql } from "@english.now/db";
import type { MiddlewareHandler } from "hono";

interface RateLimitOptions {
	max: number;
	windowMs: number;
}

export function rateLimit({
	max,
	windowMs,
}: RateLimitOptions): MiddlewareHandler {
	return async (c, next) => {
		const session = c.get("session");
		const userId = session?.user?.id;
		if (!userId) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const key = `${userId}:${c.req.path}`;
		const now = Date.now();
		const windowStart = new Date(now - (now % windowMs));

		const result = await db
			.insert(rateLimits)
			.values({ key, windowStart, count: 1 })
			.onConflictDoUpdate({
				target: [rateLimits.key, rateLimits.windowStart],
				set: { count: sql`${rateLimits.count} + 1` },
			})
			.returning({ count: rateLimits.count });

		const count = result[0]?.count ?? 1;

		c.header("X-RateLimit-Limit", String(max));
		c.header("X-RateLimit-Remaining", String(Math.max(0, max - count)));

		if (count > max) {
			const retryAfterMs = windowMs - (now % windowMs);
			c.header("Retry-After", String(Math.ceil(retryAfterMs / 1000)));
			return c.json({ error: "Rate limit exceeded" }, 429);
		}

		return next();
	};
}
