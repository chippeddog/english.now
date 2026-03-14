import {
	conversationFeedback,
	conversationMessage,
	conversationSession,
	db,
} from "@english.now/db";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { getReportAccessSummary } from "../services/feature-gating";

export const feedbackRouter = router({
	getFeedback: protectedProcedure
		.input(z.object({ sessionId: z.string() }))
		.query(async ({ ctx, input }) => {
			const feedback = await db
				.select()
				.from(conversationFeedback)
				.where(eq(conversationFeedback.sessionId, input.sessionId))
				.limit(1);

			if (!feedback[0]) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Feedback not found",
				});
			}

			if (feedback[0].userId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Unauthorized",
				});
			}

			const session = await db
				.select()
				.from(conversationSession)
				.where(eq(conversationSession.id, input.sessionId))
				.limit(1);

			const messages = await db
				.select()
				.from(conversationMessage)
				.where(eq(conversationMessage.sessionId, input.sessionId))
				.orderBy(conversationMessage.createdAt);

			const reportAccess = await getReportAccessSummary(ctx.session.user.id);
			const fullFeedback = feedback[0];
			const maskedFeedback =
				reportAccess.locked && fullFeedback.status === "completed"
					? {
							...fullFeedback,
							grammarScore: null,
							vocabularyScore: null,
							fluencyScore: null,
							pronunciationScore: null,
							strengths: null,
							improvements: null,
							corrections: (fullFeedback.corrections ?? [])
								.slice(0, 2)
								.map((correction) => ({
									...correction,
									explanation: null,
								})),
							vocabularySuggestions: null,
						}
					: fullFeedback;

			return {
				feedback: maskedFeedback,
				session: session[0] ?? null,
				messages,
				reportAccess,
			};
		}),
});
