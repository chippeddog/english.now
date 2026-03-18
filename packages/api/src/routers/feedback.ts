import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { getConversationReviewData } from "../services/conversation-review";

export const feedbackRouter = router({
	getFeedback: protectedProcedure
		.input(z.object({ sessionId: z.string() }))
		.query(async ({ ctx, input }) => {
			return getConversationReviewData({
				sessionId: input.sessionId,
				userId: ctx.session.user.id,
			});
		}),
});
