import type { ConversationReview } from "@english.now/db";
import { describe, expect, it } from "vitest";
import { limitReviewForPreview } from "./conversation-review";

function makeReview(problemCount: number): ConversationReview {
	const problems = Array.from({ length: problemCount }, (_, index) => ({
		id: `p${index + 1}`,
		type: "grammar",
	}));
	const tasks = problems.map((problem) => ({
		id: `t-${problem.id}`,
		problemId: problem.id,
		type: "grammar",
	}));

	return {
		availability: "ready",
		overallScore: 70,
		scores: { grammar: 70, vocabulary: 70, pronunciation: null },
		problems,
		tasks,
		stats: { totalProblems: problemCount, totalTasks: problemCount },
	} as unknown as ConversationReview;
}

describe("limitReviewForPreview", () => {
	it("keeps only the first corrections and their tasks", () => {
		const preview = limitReviewForPreview(makeReview(5), 2);

		expect(preview.problems.map((problem) => problem.id)).toEqual(["p1", "p2"]);
		expect(preview.tasks.map((task) => task.problemId)).toEqual(["p1", "p2"]);
	});

	it("still reports full totals and scores", () => {
		const preview = limitReviewForPreview(makeReview(5), 2);

		expect(preview.stats).toEqual({ totalProblems: 5, totalTasks: 5 });
		expect(preview.overallScore).toBe(70);
	});

	it("leaves short reviews untouched", () => {
		const review = makeReview(1);
		expect(limitReviewForPreview(review, 2).problems).toHaveLength(1);
	});
});
