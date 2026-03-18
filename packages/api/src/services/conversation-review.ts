import {
	type ConversationFeedback,
	type ConversationReview,
	type ConversationReviewAttempt,
	type ConversationReviewProblem,
	type ConversationReviewProblemType,
	type ConversationReviewStatus,
	type ConversationReviewTask,
	type ConversationSession,
	conversationFeedback,
	conversationMessage,
	conversationReviewAttempt,
	conversationSession,
	db,
	eq,
} from "@english.now/db";
import { TRPCError } from "@trpc/server";
import { getReportAccessSummary } from "./feature-gating";

function toReviewStatus(
	status: string | null | undefined,
): ConversationReviewStatus {
	if (status === "completed") return "completed";
	if (status === "failed") return "failed";
	if (status === "generating") return "processing";
	return "pending";
}

function createLegacyTask(
	problem: ConversationReviewProblem,
): ConversationReviewTask {
	if (problem.type === "pronunciation") {
		const target =
			problem.pronunciationTargets?.[0]?.text ?? problem.suggestedText;
		return {
			id: `legacy-task-${problem.id}`,
			problemId: problem.id,
			type: "pronunciation",
			taskType: "pronunciation-drill",
			prompt: `Repeat "${target}" and try to score 75 or higher.`,
			payload: {
				practiceText: target,
				pronunciationTarget: target,
				targetScore: 75,
				hint: problem.explanation,
			},
		};
	}

	return {
		id: `legacy-task-${problem.id}`,
		problemId: problem.id,
		type: problem.type,
		taskType:
			problem.type === "grammar"
				? "repeat-correction"
				: problem.sourceText === problem.suggestedText
					? "swap-word"
					: "rephrase",
		prompt:
			problem.type === "grammar"
				? "Say the improved sentence once."
				: "Use the stronger wording once in your own voice.",
		payload: {
			sourceText: problem.sourceText,
			suggestedText: problem.suggestedText,
			practiceText: problem.suggestedText,
			vocabularyItems: problem.vocabularyItems,
			phraseToSave:
				problem.type === "vocabulary" ? problem.suggestedText : undefined,
		},
	};
}

export function buildLegacyConversationReview(
	feedback: ConversationFeedback,
): ConversationReview {
	const allowedTypes = new Set<ConversationReviewProblemType>([
		"grammar",
		"vocabulary",
		"pronunciation",
	]);

	const correctionProblems = (feedback.corrections ?? [])
		.filter(
			(
				item,
			): item is typeof item & {
				type: ConversationReviewProblemType;
			} => allowedTypes.has(item.type as ConversationReviewProblemType),
		)
		.map((item, index) => {
			const type = item.type;
			return {
				id: `legacy-problem-${index + 1}`,
				type,
				title:
					type === "grammar"
						? "Fix this sentence"
						: type === "vocabulary"
							? "Use a stronger phrase"
							: "Practice this pronunciation target",
				sourceText: item.original,
				suggestedText: item.corrected,
				explanation: item.explanation,
				severity: "medium" as const,
				vocabularyItems:
					type === "vocabulary"
						? (feedback.vocabularySuggestions ?? []).slice(0, 2)
						: undefined,
				pronunciationTargets:
					type === "pronunciation"
						? [
								{
									text: item.corrected,
									score: feedback.pronunciationScore ?? 0,
								},
							]
						: undefined,
			} satisfies ConversationReviewProblem;
		});

	const suggestionProblems = (feedback.vocabularySuggestions ?? [])
		.filter(
			(term) =>
				!correctionProblems.some(
					(problem) =>
						problem.type === "vocabulary" &&
						problem.vocabularyItems?.includes(term),
				),
		)
		.slice(0, 2)
		.map((term, index) => {
			const id = `legacy-suggestion-${index + 1}`;
			return {
				id,
				type: "vocabulary" as const,
				title: "Add this useful phrase",
				sourceText: term,
				suggestedText: term,
				explanation:
					"Save this word or phrase so you can reuse it in future sessions.",
				severity: "low" as const,
				vocabularyItems: [term],
			} satisfies ConversationReviewProblem;
		});

	const problems = [...correctionProblems, ...suggestionProblems];
	const tasks = problems.map(createLegacyTask);

	return {
		availability: "ready",
		overallScore: feedback.overallScore ?? null,
		scores: {
			grammar: feedback.grammarScore ?? null,
			vocabulary: feedback.vocabularyScore ?? null,
			pronunciation: feedback.pronunciationScore ?? null,
		},
		problems,
		tasks,
		stats: {
			totalProblems: problems.length,
			totalTasks: tasks.length,
		},
	};
}

function getResolvedReview(input: {
	session: ConversationSession;
	legacyFeedback: ConversationFeedback | null;
}) {
	const sessionReview = input.session.review as
		| ConversationReview
		| null
		| undefined;
	if (sessionReview) {
		return {
			review: sessionReview,
			reviewStatus: input.session.reviewStatus,
		};
	}

	if (input.legacyFeedback) {
		return {
			review: buildLegacyConversationReview(input.legacyFeedback),
			reviewStatus: toReviewStatus(input.legacyFeedback.status),
		};
	}

	return {
		review: null,
		reviewStatus: input.session.reviewStatus,
	};
}

export function calculateConversationPracticeProgress(
	review: ConversationReview | null,
	attempts: ConversationReviewAttempt[],
) {
	const tasks = review?.tasks ?? [];
	const totals = {
		totalTasks: tasks.length,
		practicedTasks: 0,
		completedTasks: 0,
		skippedTasks: 0,
		byType: {
			grammar: { total: 0, practiced: 0, completed: 0, skipped: 0 },
			vocabulary: { total: 0, practiced: 0, completed: 0, skipped: 0 },
			pronunciation: { total: 0, practiced: 0, completed: 0, skipped: 0 },
		},
	};

	const attemptMap = new Map(
		attempts.map((attempt) => [attempt.taskId, attempt]),
	);

	for (const task of tasks) {
		const bucket = totals.byType[task.type];
		bucket.total += 1;
		const attempt = attemptMap.get(task.id);
		if (!attempt) continue;

		if (attempt.status === "skipped") {
			totals.skippedTasks += 1;
			bucket.skipped += 1;
			continue;
		}

		totals.practicedTasks += 1;
		bucket.practiced += 1;

		if (attempt.status === "completed") {
			totals.completedTasks += 1;
			bucket.completed += 1;
		}
	}

	return totals;
}

export async function getConversationReviewData(input: {
	sessionId: string;
	userId: string;
}) {
	const [session] = await db
		.select()
		.from(conversationSession)
		.where(eq(conversationSession.id, input.sessionId))
		.limit(1);

	if (!session) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Session not found",
		});
	}

	if (session.userId !== input.userId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Unauthorized",
		});
	}

	const [messages, attempts, reportAccess, legacyFeedbackRows] =
		await Promise.all([
			db
				.select()
				.from(conversationMessage)
				.where(eq(conversationMessage.sessionId, input.sessionId))
				.orderBy(conversationMessage.createdAt),
			db
				.select()
				.from(conversationReviewAttempt)
				.where(eq(conversationReviewAttempt.sessionId, input.sessionId)),
			getReportAccessSummary(input.userId),
			db
				.select()
				.from(conversationFeedback)
				.where(eq(conversationFeedback.sessionId, input.sessionId))
				.limit(1),
		]);

	const legacyFeedback = legacyFeedbackRows[0] ?? null;
	const { review, reviewStatus } = getResolvedReview({
		session,
		legacyFeedback,
	});

	return {
		session,
		messages,
		review,
		reviewStatus,
		attempts,
		practiceProgress: calculateConversationPracticeProgress(review, attempts),
		reportAccess,
	};
}
