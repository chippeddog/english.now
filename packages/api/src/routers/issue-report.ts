import {
	conversationSession,
	db,
	eq,
	issueReport,
	pronunciationSession,
} from "@english.now/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { rateLimitedProcedure, router } from "../index";

export const issueReportRouter = router({
	submit: rateLimitedProcedure(1, 60_000)
		.input(
			z.object({
				sessionId: z.string(),
				sessionType: z.enum(["conversation", "pronunciation"]),
				category: z.string(),
				description: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const table =
				input.sessionType === "conversation"
					? conversationSession
					: pronunciationSession;

			const [session] = await db
				.select({ userId: table.userId })
				.from(table)
				.where(eq(table.id, input.sessionId))
				.limit(1);

			if (!session) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Session not found",
				});
			}

			if (session.userId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Unauthorized",
				});
			}

			await db.insert(issueReport).values({
				id: crypto.randomUUID(),
				userId: ctx.session.user.id,
				sessionId: input.sessionId,
				sessionType: input.sessionType,
				category: input.category,
				description: input.description,
			});

			return { success: true };
		}),
});
