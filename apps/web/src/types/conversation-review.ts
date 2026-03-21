import type { AppRouter } from "@english.now/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";

type BaseProblem = NonNullable<
	inferRouterOutputs<AppRouter>["conversation"]["getReview"]["review"]
>["problems"][number];

/**
 * Optional fields stored in `conversation_session.review` JSON.
 * Extends the tRPC problem type for UI; keep aligned with `packages/db` schema.
 */
export type ReviewProblem = BaseProblem & {
	transcriptSpan?: { messageId: string; start: number; end: number };
	contextSnippet?: string;
	practiceVariant?:
		| "repeat"
		| "question-transform"
		| "fill-blank"
		| "choose-option"
		| "personalize";
	alternatives?: string[];
	articulationTip?: string;
	pronunciationTargets?: Array<{
		text: string;
		score: number;
		errorType?: string;
		messageId?: string;
		sentenceContext?: string;
		soundLabel?: string;
		highlightIndex?: number;
		highlightEndIndex?: number;
		transcriptSpan?: { messageId: string; start: number; end: number };
	}>;
};
