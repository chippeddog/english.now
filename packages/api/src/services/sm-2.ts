export const SM2_MIN_EASE_FACTOR = 1.3;
export const SM2_INITIAL_EASE_FACTOR = 2.5;
const FAILURE_RETRY_HOURS = 4;

export type VocabularyMastery = "new" | "learning" | "reviewing" | "mastered";

export type Sm2State = {
	repetition: number;
	intervalDays: number;
	easeFactor: number;
	lapses: number;
};

export type Sm2ReviewInput = Sm2State & {
	quality: number;
	reviewedAt?: Date;
};

export type Sm2ReviewResult = Sm2State & {
	lastReviewedAt: Date;
	nextReviewAt: Date;
};

function addDays(date: Date, days: number): Date {
	return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function addHours(date: Date, hours: number): Date {
	return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function clampEaseFactor(easeFactor: number): number {
	return Math.max(SM2_MIN_EASE_FACTOR, Number(easeFactor.toFixed(2)));
}

function calculateNextEaseFactor(easeFactor: number, quality: number): number {
	const delta =
		0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
	return clampEaseFactor(easeFactor + delta);
}

export function applySm2Review(input: Sm2ReviewInput): Sm2ReviewResult {
	const reviewedAt = input.reviewedAt ?? new Date();
	const easeFactor = calculateNextEaseFactor(
		input.easeFactor || SM2_INITIAL_EASE_FACTOR,
		input.quality,
	);

	if (input.quality < 3) {
		return {
			repetition: 0,
			intervalDays: 0,
			easeFactor,
			lapses: input.lapses + 1,
			lastReviewedAt: reviewedAt,
			nextReviewAt: addHours(reviewedAt, FAILURE_RETRY_HOURS),
		};
	}

	const repetition = input.repetition + 1;
	let intervalDays = 1;

	if (repetition === 2) {
		intervalDays = 6;
	} else if (repetition > 2) {
		const previousInterval = Math.max(input.intervalDays, 1);
		intervalDays = Math.max(1, Math.round(previousInterval * easeFactor));
	}

	return {
		repetition,
		intervalDays,
		easeFactor,
		lapses: input.lapses,
		lastReviewedAt: reviewedAt,
		nextReviewAt: addDays(reviewedAt, intervalDays),
	};
}

export function deriveVocabularyMastery(
	state: Pick<Sm2State, "repetition" | "intervalDays">,
): VocabularyMastery {
	if (state.repetition === 0) return "new";
	if (state.repetition === 1 || state.intervalDays <= 1) return "learning";
	if (state.intervalDays >= 21) return "mastered";
	return "reviewing";
}

export function isVocabularyItemDue(
	nextReviewAt: Date | string | null,
	now = new Date(),
): boolean {
	if (!nextReviewAt) return true;
	const dueAt =
		nextReviewAt instanceof Date ? nextReviewAt : new Date(nextReviewAt);
	return dueAt.getTime() <= now.getTime();
}
