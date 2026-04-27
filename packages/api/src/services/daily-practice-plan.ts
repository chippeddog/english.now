import type {
	CefrLevel,
	DailyConversationActivity,
	DailyPracticeActivity,
	DailyPracticePlan,
	DailyPracticePlanStatus,
	DailyPronunciationActivity,
	DailyVocabularyActivity,
	DailyVocabularyCard,
} from "@english.now/db";
import {
	and,
	conversationSuggestion,
	course,
	courseVersion,
	dailyPracticePlan,
	db,
	enrollment,
	eq,
	phrase,
	phraseTranslation,
	userPhrase,
	userProfile,
	userWord,
	word,
	wordTranslation,
} from "@english.now/db";
import { FREE_DAILY_VOCAB_REVIEW_LIMIT } from "@english.now/shared/feature-limit-config";
import { profileLevelToCefr } from "../lib/cefr";
import {
	buildDefaultConversationGoals,
	buildDefaultConversationModeConfig,
} from "./conversation-mode";
import { getDailyFeatureUsageTotal } from "./feature-usage";
import { generateParagraph } from "./generate-paragraph";
import { generateSuggestions } from "./generate-suggestions";
import { isVocabularyItemDue } from "./sm-2";
import { getSubscriptionSummaryForUser } from "./subscription";

type PracticeProfile = {
	level: string | null;
	cefrLevel: CefrLevel | null;
	interests: string[] | null;
	focusAreas: string[] | null;
	goal: string | null;
	nativeLanguage: string | null;
	timezone: string | null;
};

export type DailyPracticePlanJobData = {
	userId: string;
	dayKey: string;
};

export type EnsureDailyPracticePlanResult = {
	plan: DailyPracticePlan;
	wasEnqueued: boolean;
};

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	return "Failed to generate daily practice plan";
}

function shuffle<T>(items: T[]): T[] {
	const copy = [...items];

	for (let index = copy.length - 1; index > 0; index--) {
		const randomIndex = Math.floor(Math.random() * (index + 1));
		const current = copy[index];
		copy[index] = copy[randomIndex] as T;
		copy[randomIndex] = current as T;
	}

	return copy;
}

function getDurationFromCardCount(cardCount: number): number {
	if (cardCount <= 5) return 2;
	if (cardCount <= 8) return 3;
	return 4;
}

async function getActiveEnrollmentLevel(
	userId: string,
	activeEnrollmentId: string | null,
): Promise<CefrLevel | null> {
	if (!activeEnrollmentId) return null;
	const [row] = await db
		.select({ level: course.level })
		.from(enrollment)
		.innerJoin(courseVersion, eq(courseVersion.id, enrollment.courseVersionId))
		.innerJoin(course, eq(course.id, courseVersion.courseId))
		.where(
			and(eq(enrollment.id, activeEnrollmentId), eq(enrollment.userId, userId)),
		)
		.limit(1);
	return row?.level ?? null;
}

async function getPracticeProfile(userId: string): Promise<PracticeProfile> {
	const [profile] = await db
		.select({
			level: userProfile.level,
			activeEnrollmentId: userProfile.activeEnrollmentId,
			interests: userProfile.interests,
			focusAreas: userProfile.focusAreas,
			goal: userProfile.goal,
			nativeLanguage: userProfile.nativeLanguage,
			timezone: userProfile.timezone,
		})
		.from(userProfile)
		.where(eq(userProfile.userId, userId))
		.limit(1);

	// The CEFR attached to the primary enrollment's course_version is the
	// canonical source of truth. If the user has no active enrollment yet we
	// fall through to the onboarding-proficiency bucket in callers.
	const enrollmentLevel = await getActiveEnrollmentLevel(
		userId,
		profile?.activeEnrollmentId ?? null,
	);

	return {
		level: profile?.level ?? null,
		cefrLevel: enrollmentLevel,
		interests: profile?.interests ?? null,
		focusAreas: profile?.focusAreas ?? null,
		goal: profile?.goal ?? null,
		nativeLanguage: profile?.nativeLanguage ?? null,
		timezone: profile?.timezone ?? "UTC",
	};
}

export function getDayKey(date: Date, timezone: string): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(date);
}

export async function getTodayPracticePlanRecord(userId: string) {
	const profile = await getPracticeProfile(userId);
	const timezone = profile.timezone || "UTC";
	const dayKey = getDayKey(new Date(), timezone);

	const [plan] = await db
		.select()
		.from(dailyPracticePlan)
		.where(
			and(
				eq(dailyPracticePlan.userId, userId),
				eq(dailyPracticePlan.dayKey, dayKey),
			),
		)
		.limit(1);

	return {
		plan,
		profile,
		dayKey,
		timezone,
	};
}

export function getHomeActivities(
	plan: Pick<DailyPracticePlan, "activities" | "homeSelection">,
) {
	const selectedIds = new Set(plan.homeSelection);
	const activitiesById = new Map(
		plan.activities.map((activity) => [activity.id, activity] as const),
	);

	return plan.homeSelection
		.map((activityId) => activitiesById.get(activityId))
		.filter((activity): activity is DailyPracticeActivity => Boolean(activity))
		.filter((activity) => selectedIds.has(activity.id));
}

async function updateTodayPracticeActivity(
	userId: string,
	matcher: (activity: DailyPracticeActivity) => boolean,
	updater: (
		activity: DailyPracticeActivity,
		nowIso: string,
	) => DailyPracticeActivity,
) {
	const { plan } = await getTodayPracticePlanRecord(userId);

	if (!plan) {
		return false;
	}

	let didUpdate = false;
	const now = new Date();
	const nowIso = now.toISOString();
	const activities = plan.activities.map((activity) => {
		if (!matcher(activity)) {
			return activity;
		}

		didUpdate = true;
		return updater(activity, nowIso);
	});

	if (!didUpdate) {
		return false;
	}

	await db
		.update(dailyPracticePlan)
		.set({ activities, updatedAt: now })
		.where(eq(dailyPracticePlan.id, plan.id));

	return true;
}

export async function markDailyPracticeActivityStarted(
	userId: string,
	input: {
		activityId: string;
		sessionId: string;
	},
) {
	return updateTodayPracticeActivity(
		userId,
		(activity) => activity.id === input.activityId,
		(activity, nowIso) => ({
			...activity,
			startedAt: activity.startedAt ?? nowIso,
			sessionId: input.sessionId,
		}),
	);
}

export async function markDailyPracticeActivityCompleted(
	userId: string,
	input: {
		sessionId: string;
		activityId?: string;
	},
) {
	return updateTodayPracticeActivity(
		userId,
		(activity) =>
			input.activityId
				? activity.id === input.activityId
				: activity.sessionId === input.sessionId,
		(activity, nowIso) => ({
			...activity,
			startedAt: activity.startedAt ?? nowIso,
			completedAt: nowIso,
			sessionId: input.sessionId,
		}),
	);
}

function createConversationActivities(
	topics: NonNullable<
		Awaited<ReturnType<typeof generateSuggestions>>["topics"]
	>,
	roleplays: NonNullable<
		Awaited<ReturnType<typeof generateSuggestions>>["roleplays"]
	>,
): DailyConversationActivity[] {
	return [
		...topics.map((topic, index) => ({
			id: `conversation-topic-${index + 1}`,
			emoji: topic.icon,
			title: topic.name,
			description: topic.description,
			duration: 4,
			type: "conversation" as const,
			typeLabel: "Conversation",
			startedAt: null,
			completedAt: null,
			sessionId: null,
			payload: {
				scenario: topic.id,
				scenarioName: topic.name,
				scenarioDescription: topic.description,
				goals: buildDefaultConversationGoals({
					mode: "general-conversation",
					title: topic.name,
				}),
				mode: "general-conversation" as const,
				modeConfig: buildDefaultConversationModeConfig({
					mode: "general-conversation",
					sourceId: topic.id,
					subtitle: topic.description,
				}),
			},
		})),
		...roleplays.map((roleplay, index) => ({
			id: `conversation-roleplay-${index + 1}`,
			emoji: roleplay.icon,
			title: roleplay.name,
			description: roleplay.description,
			duration: 5,
			type: "conversation" as const,
			typeLabel: "Roleplay",
			startedAt: null,
			completedAt: null,
			sessionId: null,
			payload: {
				scenario: roleplay.id,
				scenarioName: roleplay.name,
				scenarioDescription: roleplay.description,
				aiRole: roleplay.aiRole,
				goals: buildDefaultConversationGoals({
					mode: "roleplay",
					title: roleplay.name,
				}),
				mode: "roleplay" as const,
				modeConfig: buildDefaultConversationModeConfig({
					mode: "roleplay",
					sourceId: roleplay.id,
					subtitle: roleplay.description,
				}),
			},
		})),
	];
}

async function createPronunciationActivities(
	level: CefrLevel,
	interests: string[] | null,
): Promise<DailyPronunciationActivity[]> {
	const paragraphs = await Promise.all(
		Array.from({ length: 3 }, () =>
			generateParagraph(level, interests ?? undefined),
		),
	);

	return paragraphs.map((paragraph, index) => ({
		id: `pronunciation-${index + 1}`,
		emoji: paragraph.icon,
		title: paragraph.topic,
		description: paragraph.tips,
		duration: 3,
		type: "pronunciation" as const,
		typeLabel: "Read Aloud",
		startedAt: null,
		completedAt: null,
		sessionId: null,
		payload: {
			paragraph,
		},
	}));
}

type ScheduledVocabularyCard = DailyVocabularyCard & {
	createdAt: Date;
	intervalDays: number;
	nextReviewAt: string | null;
	isDue: boolean;
};

function sortDueVocabularyCards(cards: ScheduledVocabularyCard[]) {
	return [...cards].sort((a, b) => {
		const aDueTime = a.nextReviewAt ? new Date(a.nextReviewAt).getTime() : 0;
		const bDueTime = b.nextReviewAt ? new Date(b.nextReviewAt).getTime() : 0;

		if (aDueTime !== bDueTime) {
			return aDueTime - bDueTime;
		}

		if (a.intervalDays !== b.intervalDays) {
			return a.intervalDays - b.intervalDays;
		}

		return a.createdAt.getTime() - b.createdAt.getTime();
	});
}

async function createVocabularyActivities(
	userId: string,
	language: string | null,
	reviewCardLimit: number,
): Promise<DailyVocabularyActivity[]> {
	if (reviewCardLimit <= 0) {
		return [];
	}

	const translationLanguage = language ?? "uk";
	const now = new Date();

	const [wordRows, phraseRows] = await Promise.all([
		db
			.select({
				id: userWord.id,
				lemma: word.lemma,
				ipa: word.ipa,
				audioUrl: word.audioUrl,
				definition: word.definition,
				exampleSentence: word.exampleSentence,
				level: word.level,
				translation: wordTranslation.translation,
				mastery: userWord.mastery,
				intervalDays: userWord.intervalDays,
				lastReviewedAt: userWord.lastReviewedAt,
				nextReviewAt: userWord.nextReviewAt,
				createdAt: userWord.createdAt,
			})
			.from(userWord)
			.innerJoin(word, eq(userWord.wordId, word.id))
			.leftJoin(
				wordTranslation,
				and(
					eq(wordTranslation.wordId, word.id),
					eq(wordTranslation.language, translationLanguage),
				),
			)
			.where(eq(userWord.userId, userId)),
		db
			.select({
				id: userPhrase.id,
				text: phrase.text,
				ipa: phrase.ipa,
				audioUrl: phrase.audioUrl,
				meaning: phrase.meaning,
				exampleUsage: phrase.exampleUsage,
				level: phrase.level,
				translation: phraseTranslation.translation,
				mastery: userPhrase.mastery,
				intervalDays: userPhrase.intervalDays,
				lastReviewedAt: userPhrase.lastReviewedAt,
				nextReviewAt: userPhrase.nextReviewAt,
				createdAt: userPhrase.createdAt,
			})
			.from(userPhrase)
			.innerJoin(phrase, eq(userPhrase.phraseId, phrase.id))
			.leftJoin(
				phraseTranslation,
				and(
					eq(phraseTranslation.phraseId, phrase.id),
					eq(phraseTranslation.language, translationLanguage),
				),
			)
			.where(eq(userPhrase.userId, userId)),
	]);

	const wordCards = sortDueVocabularyCards(
		wordRows
			.filter(
				(row) =>
					!row.lastReviewedAt || isVocabularyItemDue(row.nextReviewAt, now),
			)
			.map<ScheduledVocabularyCard>((row) => ({
				id: row.id,
				type: "word",
				prompt: row.translation ?? row.definition,
				answer: row.lemma,
				ipa: row.ipa,
				audioUrl: row.audioUrl,
				detail: row.exampleSentence,
				level: row.level,
				currentMastery: row.mastery,
				intervalDays: row.intervalDays,
				nextReviewAt: row.nextReviewAt?.toISOString() ?? null,
				isDue: true,
				createdAt: row.createdAt,
			})),
	);
	const phraseCards = sortDueVocabularyCards(
		phraseRows
			.filter(
				(row) =>
					!row.lastReviewedAt || isVocabularyItemDue(row.nextReviewAt, now),
			)
			.map<ScheduledVocabularyCard>((row) => ({
				id: row.id,
				type: "phrase",
				prompt: row.translation ?? row.meaning,
				answer: row.text,
				ipa: row.ipa,
				audioUrl: row.audioUrl,
				detail: row.exampleUsage,
				level: row.level,
				currentMastery: row.mastery,
				intervalDays: row.intervalDays,
				nextReviewAt: row.nextReviewAt?.toISOString() ?? null,
				isDue: true,
				createdAt: row.createdAt,
			})),
	);

	const activities: DailyVocabularyActivity[] = [];
	let remainingReviewCards = reviewCardLimit;

	if (wordCards.length > 0 && remainingReviewCards > 0) {
		const cards = shuffle(
			wordCards.slice(0, Math.min(wordCards.length, 8, remainingReviewCards)),
		).map(({ createdAt, ...card }) => card);
		activities.push({
			id: "vocabulary-words",
			emoji: "📘",
			title: "Word Recall",
			description: "Review the vocabulary words that are due now.",
			duration: getDurationFromCardCount(cards.length),
			type: "vocabulary",
			typeLabel: "Vocabulary",
			startedAt: null,
			completedAt: null,
			sessionId: null,
			payload: {
				cards,
				focus: ["words"],
			},
		});
		remainingReviewCards -= cards.length;
	}

	if (phraseCards.length > 0 && remainingReviewCards > 0) {
		const cards = shuffle(
			phraseCards.slice(
				0,
				Math.min(phraseCards.length, 6, remainingReviewCards),
			),
		).map(({ createdAt, ...card }) => card);
		activities.push({
			id: "vocabulary-phrases",
			emoji: "✨",
			title: "Phrase Builder",
			description: "Practice the phrases that are ready for review.",
			duration: getDurationFromCardCount(cards.length),
			type: "vocabulary",
			typeLabel: "Vocabulary",
			startedAt: null,
			completedAt: null,
			sessionId: null,
			payload: {
				cards,
				focus: ["phrases"],
			},
		});
		remainingReviewCards -= cards.length;
	}

	if (wordCards.length + phraseCards.length > 0 && remainingReviewCards > 0) {
		const mixedCards = shuffle([
			...wordCards.slice(0, 6),
			...phraseCards.slice(0, 4),
		])
			.slice(0, Math.min(10, remainingReviewCards))
			.map(({ createdAt, ...card }) => card);

		if (mixedCards.length > 0) {
			activities.push({
				id: "vocabulary-mixed",
				emoji: "🧠",
				title: "Mixed Review",
				description: "Run through a balanced mix of words and phrases.",
				duration: getDurationFromCardCount(mixedCards.length),
				type: "vocabulary",
				typeLabel: "Vocabulary",
				startedAt: null,
				completedAt: null,
				sessionId: null,
				payload: {
					cards: mixedCards,
					focus: ["words", "phrases"],
				},
			});
			remainingReviewCards -= mixedCards.length;
		}
	}

	return activities;
}

function createHomeSelection(activities: DailyPracticeActivity[]) {
	const candidateIds = activities
		.filter((activity) => activity.type !== "vocabulary")
		.map((activity) => activity.id);

	return shuffle(candidateIds).slice(0, 9);
}

export async function ensureTodayPracticePlan(
	userId: string,
	enqueueJob: (data: DailyPracticePlanJobData) => Promise<unknown>,
): Promise<EnsureDailyPracticePlanResult> {
	const { plan, dayKey, timezone } = await getTodayPracticePlanRecord(userId);

	if (plan) {
		if (
			plan.status === "ready" ||
			plan.status === "queued" ||
			plan.status === "generating"
		) {
			return { plan, wasEnqueued: false };
		}

		const [updatedPlan] = await db
			.update(dailyPracticePlan)
			.set({
				status: "queued",
				error: null,
				enqueuedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(dailyPracticePlan.id, plan.id))
			.returning();

		if (!updatedPlan) {
			throw new Error("Failed to re-queue daily practice plan");
		}

		await enqueueJob({ userId, dayKey });

		return {
			plan: updatedPlan,
			wasEnqueued: true,
		};
	}

	const now = new Date();

	const [createdPlan] = await db
		.insert(dailyPracticePlan)
		.values({
			id: crypto.randomUUID(),
			userId,
			dayKey,
			timezone,
			status: "queued",
			activities: [],
			homeSelection: [],
			enqueuedAt: now,
			createdAt: now,
			updatedAt: now,
		})
		.returning();

	if (!createdPlan) {
		throw new Error("Failed to create daily practice plan");
	}

	await enqueueJob({ userId, dayKey });

	return {
		plan: createdPlan,
		wasEnqueued: true,
	};
}

export async function generateDailyPracticePlanForUser(
	userId: string,
	dayKey: string,
) {
	const profile = await getPracticeProfile(userId);
	const timezone = profile.timezone || "UTC";
	const level: CefrLevel =
		profile.cefrLevel ?? profileLevelToCefr(profile.level);

	const [existingPlan] = await db
		.select()
		.from(dailyPracticePlan)
		.where(
			and(
				eq(dailyPracticePlan.userId, userId),
				eq(dailyPracticePlan.dayKey, dayKey),
			),
		)
		.limit(1);

	let basePlan = existingPlan;

	if (!basePlan) {
		const [createdPlan] = await db
			.insert(dailyPracticePlan)
			.values({
				id: crypto.randomUUID(),
				userId,
				dayKey,
				timezone,
				status: "queued",
				activities: [],
				homeSelection: [],
				enqueuedAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		if (!createdPlan) {
			throw new Error("Failed to create daily practice plan");
		}

		basePlan = createdPlan;
	}

	await db
		.update(dailyPracticePlan)
		.set({
			status: "generating",
			error: null,
			startedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(dailyPracticePlan.id, basePlan.id));

	try {
		const [subscription, usedVocabularyReviewCount] = await Promise.all([
			getSubscriptionSummaryForUser(userId),
			getDailyFeatureUsageTotal(userId, "vocabulary_review"),
		]);
		const remainingVocabularyReviewCount = Math.max(
			0,
			subscription.isPro
				? Number.MAX_SAFE_INTEGER
				: FREE_DAILY_VOCAB_REVIEW_LIMIT - usedVocabularyReviewCount,
		);
		const [suggestions, pronunciationActivities, vocabularyActivities] =
			await Promise.all([
				generateSuggestions({
					level: profile.level,
					interests: profile.interests,
					focusAreas: profile.focusAreas,
					goal: profile.goal,
					nativeLanguage: profile.nativeLanguage,
				}),
				createPronunciationActivities(level, profile.interests),
				createVocabularyActivities(
					userId,
					profile.nativeLanguage,
					remainingVocabularyReviewCount,
				),
			]);

		const activities: DailyPracticeActivity[] = [
			...createConversationActivities(
				suggestions.topics,
				suggestions.roleplays,
			),
			...pronunciationActivities,
			...vocabularyActivities,
		];
		const homeSelection = createHomeSelection(activities);
		const now = new Date();

		const [updatedPlan] = await db
			.update(dailyPracticePlan)
			.set({
				status: "ready",
				activities,
				homeSelection,
				error: null,
				generatedAt: now,
				completedAt: now,
				updatedAt: now,
			})
			.where(eq(dailyPracticePlan.id, basePlan.id))
			.returning();

		if (!updatedPlan) {
			throw new Error("Failed to save daily practice plan");
		}

		const existingConversationSuggestion = await db
			.select({ id: conversationSuggestion.id })
			.from(conversationSuggestion)
			.where(eq(conversationSuggestion.userId, userId))
			.limit(1);

		if (existingConversationSuggestion[0]) {
			await db
				.update(conversationSuggestion)
				.set({
					topics: suggestions.topics,
					roleplays: suggestions.roleplays,
					generatedAt: now,
				})
				.where(eq(conversationSuggestion.userId, userId));
		} else {
			await db.insert(conversationSuggestion).values({
				id: crypto.randomUUID(),
				userId,
				topics: suggestions.topics,
				roleplays: suggestions.roleplays,
				generatedAt: now,
			});
		}

		return updatedPlan;
	} catch (error) {
		const [failedPlan] = await db
			.update(dailyPracticePlan)
			.set({
				status: "failed" as DailyPracticePlanStatus,
				error: getErrorMessage(error),
				updatedAt: new Date(),
			})
			.where(eq(dailyPracticePlan.id, basePlan.id))
			.returning();

		throw new Error(
			failedPlan?.error ?? "Failed to generate daily practice plan",
		);
	}
}
