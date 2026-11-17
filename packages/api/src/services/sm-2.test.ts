import { describe, expect, it } from "vitest";
import {
	applySm2Review,
	deriveVocabularyMastery,
	isVocabularyItemDue,
	SM2_INITIAL_EASE_FACTOR,
	SM2_MIN_EASE_FACTOR,
} from "./sm-2";

const reviewedAt = new Date("2026-01-01T12:00:00.000Z");
const fresh = {
	repetition: 0,
	intervalDays: 0,
	easeFactor: SM2_INITIAL_EASE_FACTOR,
	lapses: 0,
};

describe("applySm2Review", () => {
	it("schedules 1 day, then 6 days, then interval × ease factor", () => {
		const first = applySm2Review({ ...fresh, quality: 5, reviewedAt });
		expect(first).toMatchObject({
			repetition: 1,
			intervalDays: 1,
			easeFactor: 2.6,
		});
		expect(first.nextReviewAt.toISOString()).toBe("2026-01-02T12:00:00.000Z");

		const second = applySm2Review({ ...first, quality: 5, reviewedAt });
		expect(second).toMatchObject({ repetition: 2, intervalDays: 6 });

		const third = applySm2Review({ ...second, quality: 5, reviewedAt });
		expect(third.easeFactor).toBe(2.8);
		expect(third.intervalDays).toBe(Math.round(6 * 2.8));
	});

	it("resets repetition, counts a lapse and retries in 4 hours on failure", () => {
		const result = applySm2Review({
			repetition: 4,
			intervalDays: 30,
			easeFactor: 2.5,
			lapses: 1,
			quality: 2,
			reviewedAt,
		});

		expect(result).toMatchObject({
			repetition: 0,
			intervalDays: 0,
			lapses: 2,
			easeFactor: 2.18,
		});
		expect(result.nextReviewAt.toISOString()).toBe("2026-01-01T16:00:00.000Z");
	});

	it("never lets the ease factor drop below the minimum", () => {
		const result = applySm2Review({
			...fresh,
			easeFactor: SM2_MIN_EASE_FACTOR,
			quality: 0,
			reviewedAt,
		});
		expect(result.easeFactor).toBe(SM2_MIN_EASE_FACTOR);
	});

	it("treats a missing ease factor as the initial value", () => {
		const result = applySm2Review({
			...fresh,
			easeFactor: 0,
			quality: 4,
			reviewedAt,
		});
		expect(result.easeFactor).toBe(2.5);
	});
});

describe("deriveVocabularyMastery", () => {
	it.each([
		[{ repetition: 0, intervalDays: 0 }, "new"],
		[{ repetition: 1, intervalDays: 1 }, "learning"],
		[{ repetition: 3, intervalDays: 1 }, "learning"],
		[{ repetition: 3, intervalDays: 16 }, "reviewing"],
		[{ repetition: 5, intervalDays: 21 }, "mastered"],
	] as const)("%o is %s", (state, expected) => {
		expect(deriveVocabularyMastery(state)).toBe(expected);
	});
});

describe("isVocabularyItemDue", () => {
	const now = new Date("2026-01-10T00:00:00.000Z");

	it("is due when never scheduled", () => {
		expect(isVocabularyItemDue(null, now)).toBe(true);
	});

	it("compares Date and ISO string schedules against now", () => {
		expect(isVocabularyItemDue("2026-01-09T23:59:59.000Z", now)).toBe(true);
		expect(isVocabularyItemDue(now, now)).toBe(true);
		expect(isVocabularyItemDue(new Date("2026-01-11T00:00:00.000Z"), now)).toBe(
			false,
		);
	});
});
