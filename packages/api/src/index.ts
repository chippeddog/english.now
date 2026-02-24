import { db, rateLimits, sql } from "@english.now/db";
import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
			cause: "No session",
		});
	}
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
		},
	});
});

export const rateLimitedProcedure = (max: number, windowMs: number) =>
	protectedProcedure.use(async ({ ctx, next, path }) => {
		const userId = ctx.session.user.id;
		const key = `${userId}:trpc:${path}`;
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

		if (count > max) {
			throw new TRPCError({
				code: "TOO_MANY_REQUESTS",
				message: "Rate limit exceeded",
			});
		}

		return next();
	});
