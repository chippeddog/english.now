import { describe, expect, it } from "vitest";
import {
	buildDailyAccessSummary,
	buildSessionCapAccessSummary,
	countExpectedAssistantReplies,
} from "./feature-gating";

describe("buildDailyAccessSummary", () => {
	it("gives Pro users unlimited access", () => {
		expect(
			buildDailyAccessSummary({ isPro: true, used: 99, limit: 1 }),
		).toMatchObject({ hasAccess: true, limit: null, reason: "pro" });
	});

	it("tracks the remaining free allowance", () => {
		expect(
			buildDailyAccessSummary({ isPro: false, used: 2, limit: 3 }),
		).toMatchObject({
			hasAccess: true,
			remaining: 1,
			reason: "free_available",
		});
		expect(
			buildDailyAccessSummary({ isPro: false, used: 3, limit: 3 }),
		).toMatchObject({
			hasAccess: false,
			remaining: 0,
			reason: "free_limit_reached",
		});
	});
});

describe("buildSessionCapAccessSummary", () => {
	it("applies the free cap", () => {
		expect(
			buildSessionCapAccessSummary({ isPro: false, used: 1, freeLimit: 1 }),
		).toMatchObject({ reachedLimit: true, remaining: 0 });
	});

	it("applies the Pro cap when there is one", () => {
		expect(
			buildSessionCapAccessSummary({
				isPro: true,
				used: 2,
				freeLimit: 1,
				proLimit: 3,
			}),
		).toMatchObject({ reachedLimit: false, remaining: 1, limit: 3 });
	});

	it("is unlimited for Pro users without a Pro cap", () => {
		expect(
			buildSessionCapAccessSummary({ isPro: true, used: 50, freeLimit: 8 }),
		).toMatchObject({ reachedLimit: false, limit: null });
	});
});

describe("countExpectedAssistantReplies", () => {
	it("counts the greeting plus one reply per learner message", () => {
		expect(
			countExpectedAssistantReplies(["assistant", "user", "assistant"]),
		).toBe(2);
	});

	it("counts replies that are still streaming", () => {
		// Two learner messages were sent in parallel; neither reply is saved yet.
		expect(countExpectedAssistantReplies(["assistant", "user", "user"])).toBe(
			3,
		);
	});

	it("works for sessions without a greeting", () => {
		expect(countExpectedAssistantReplies(["user", "assistant", "user"])).toBe(
			2,
		);
		expect(countExpectedAssistantReplies([])).toBe(0);
	});
});
