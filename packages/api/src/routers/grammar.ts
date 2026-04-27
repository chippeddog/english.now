import { createHash } from "node:crypto";
import {
	and,
	asc,
	db,
	desc,
	eq,
	grammarAttempt,
	grammarMistake,
	grammarSession,
	grammarTopic,
	grammarTopicRelation,
	inArray,
	isNull,
	sql,
	userGrammarProgress,
	userProfile,
} from "@english.now/db";
import {
	type GrammarAttempt,
	type GrammarDiagnoseResult,
	type GrammarItemPhase,
	type GrammarSession,
	type GrammarSessionItem,
	type GrammarSessionSummary,
	type GrammarTopic,
	type GrammarTopicContent,
	grammarPracticeItem,
	grammarPracticeSet,
} from "@english.now/db/schema/grammar";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, rateLimitedProcedure, router } from "../index";
import { getGrammarAccessSummary } from "../services/feature-gating";
import {
	isUnsupportedFeatureUsageValue,
	recordDailyFeatureUsage,
} from "../services/feature-usage";
import { generateGrammarDrill } from "../services/generate-grammar-drill";
import { gradeGrammarFreeAnswer } from "../services/grade-grammar-free-answer";
import { recordActivity } from "../services/record-activity";
import { applySm2Review, SM2_INITIAL_EASE_FACTOR } from "../services/sm-2";

type GrammarTopicStatus =
	| "completed"
	| "in_progress"
	| "not_started"
	| "locked";
type GrammarMastery = "not_started" | "learning" | "confident" | "mastered";

const MAX_LEGACY_DRILL_ITEMS = 10;
const SESSION_PRACTICE_ITEM_COUNT = 10;
const PASSING_SCORE = 80;

function getTopicDescription(
	content: GrammarTopicContent | null,
	summary: string,
) {
	return content?.description ?? summary;
}

function getGrammarRuleTitles(content: GrammarTopicContent | null) {
	if (!content || !Array.isArray(content.rules)) {
		return [];
	}

	return content.rules
		.map((rule) => rule?.title)
		.filter(
			(title): title is string => typeof title === "string" && title.length > 0,
		);
}

function getGrammarVocabulary(content: GrammarTopicContent | null) {
	if (!content || !Array.isArray(content.vocabulary)) {
		return [];
	}

	return content.vocabulary
		.map((item) => item?.word)
		.filter(
			(word): word is string => typeof word === "string" && word.length > 0,
		);
}

function getGrammarObjectives(content: GrammarTopicContent | null) {
	if (!content || !Array.isArray(content.objectives)) {
		return [];
	}

	return content.objectives.filter(
		(objective): objective is string =>
			typeof objective === "string" && objective.length > 0,
	);
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeAnswer(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replace(/[.,!?;:"']/g, "")
		.replace(/\s+/g, " ");
}

function stringifyCorrectAnswer(answer: string | string[]) {
	return Array.isArray(answer) ? answer.join(" | ") : answer;
}

function matchesCorrectAnswer(
	userAnswer: string,
	correctAnswer: string | string[] | undefined,
) {
	if (!correctAnswer) {
		return false;
	}

	const normalizedUserAnswer = normalizeAnswer(userAnswer);

	if (Array.isArray(correctAnswer)) {
		return correctAnswer.some(
			(answer) => normalizeAnswer(answer) === normalizedUserAnswer,
		);
	}

	return normalizeAnswer(correctAnswer) === normalizedUserAnswer;
}

function buildLegacyDrillItems(
	content: GrammarTopicContent | null,
): GrammarSessionItem[] {
	if (!content || !Array.isArray(content.rules)) {
		return [];
	}

	const items: GrammarSessionItem[] = [];

	for (const rule of content.rules) {
		if (!rule || !Array.isArray(rule.examples)) {
			continue;
		}

		for (const example of rule.examples) {
			if (!example?.sentence || !example.highlight) {
				continue;
			}

			const pattern = new RegExp(escapeRegExp(example.highlight), "i");
			if (!pattern.test(example.sentence)) {
				continue;
			}

			const prompt = example.sentence.replace(pattern, "_____");

			items.push({
				id: crypto.randomUUID(),
				phase: "controlled",
				type: "fill_in_the_blank",
				difficulty: "easy",
				prompt,
				correctAnswer: example.highlight,
				answer: example.highlight,
				ruleTitle: rule.title,
				explanation: example.note ?? rule.explanation ?? "",
				isLegacy: true,
			});
		}
	}

	for (let i = items.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const a = items[i];
		const b = items[j];
		if (a && b) {
			items[i] = b;
			items[j] = a;
		}
	}

	return items.slice(0, MAX_LEGACY_DRILL_ITEMS);
}

function countLegacyDrillItems(content: GrammarTopicContent | null) {
	if (!content) {
		return 0;
	}

	const items = buildLegacyDrillItems(content);
	return items.length;
}

function deriveDiagnoseMix(correct: number, total: number) {
	if (total <= 0 || correct <= 1) {
		return { controlled: 5, semi: 3, freer: 1 };
	}

	if (correct >= total) {
		return { controlled: 1, semi: 3, freer: 5 };
	}

	if (correct >= total - 1) {
		return { controlled: 2, semi: 3, freer: 4 };
	}

	return { controlled: 3, semi: 3, freer: 3 };
}

function buildGrammarFingerprint(item: GrammarSessionItem) {
	return JSON.stringify([
		item.ruleTitle,
		item.type,
		item.prompt,
		stringifyCorrectAnswer(item.correctAnswer ?? item.answer ?? ""),
	]);
}

function calculatePhaseBreakdown(items: GrammarSessionItem[]) {
	return items.reduce<Partial<Record<GrammarItemPhase, number>>>(
		(acc, item) => {
			acc[item.phase] = (acc[item.phase] ?? 0) + 1;
			return acc;
		},
		{},
	);
}

async function getUserNativeLanguage(userId: string) {
	const [profile] = await db
		.select({ nativeLanguage: userProfile.nativeLanguage })
		.from(userProfile)
		.where(eq(userProfile.userId, userId))
		.limit(1);

	return profile?.nativeLanguage ?? null;
}

function getPracticeGenerationMix(count: number) {
	const safeCount = Math.max(SESSION_PRACTICE_ITEM_COUNT, count);
	const controlled = Math.max(2, Math.round(safeCount * 0.45));
	const semi = Math.max(2, Math.round(safeCount * 0.35));
	const freer = Math.max(1, safeCount - controlled - semi);

	return { controlled, semi, freer };
}

function hashPracticeItem(item: GrammarSessionItem) {
	const hashable = {
		phase: item.phase,
		type: item.type,
		difficulty: item.difficulty,
		prompt: item.prompt,
		options: item.options,
		items: item.items,
		correctAnswer: item.correctAnswer,
		ruleTitle: item.ruleTitle,
	};

	return createHash("sha256").update(JSON.stringify(hashable)).digest("hex");
}

function toPracticePhase(
	phase: GrammarItemPhase,
): Exclude<GrammarItemPhase, "diagnose"> {
	return phase === "diagnose" ? "controlled" : phase;
}

async function getNextPracticeSetVersion(grammarTopicId: string) {
	const [latestSet] = await db
		.select({ version: grammarPracticeSet.version })
		.from(grammarPracticeSet)
		.where(eq(grammarPracticeSet.grammarTopicId, grammarTopicId))
		.orderBy(desc(grammarPracticeSet.version))
		.limit(1);

	return (latestSet?.version ?? 0) + 1;
}

async function loadPracticePoolItems(grammarTopicId: string, limit: number) {
	const rows = await db
		.select({
			item: grammarPracticeItem.item,
		})
		.from(grammarPracticeItem)
		.innerJoin(
			grammarPracticeSet,
			eq(grammarPracticeSet.id, grammarPracticeItem.setId),
		)
		.where(
			and(
				eq(grammarPracticeItem.grammarTopicId, grammarTopicId),
				eq(grammarPracticeItem.isActive, true),
				eq(grammarPracticeSet.isActive, true),
			),
		)
		.orderBy(sql`random()`)
		.limit(limit);

	return rows.map(({ item }) => ({
		...item,
		id: crypto.randomUUID(),
	}));
}

async function generateRuntimePracticeSet(input: {
	topic: GrammarTopic;
	nativeLanguage?: string | null;
	count?: number;
}) {
	const count = input.count ?? 30;
	const version = await getNextPracticeSetVersion(input.topic.id);
	const setId = `grammar_practice_set:${input.topic.slug}:runtime:v${version}`;
	const drill = await generateGrammarDrill({
		topic: {
			title: input.topic.title,
			cefrLevel: input.topic.cefrLevel,
			category: input.topic.category,
			content: input.topic.content as GrammarTopicContent,
		},
		nativeLanguage: input.nativeLanguage,
		difficultyMix: getPracticeGenerationMix(count),
		mode: "practice_only",
	});

	const items = drill.items
		.filter((item) => item.phase !== "diagnose")
		.slice(0, count);

	await db.insert(grammarPracticeSet).values({
		id: setId,
		grammarTopicId: input.topic.id,
		version,
		itemCount: 0,
		metadata: {
			model: "gpt-5.4-mini",
			promptVersion: "grammar-drill-v1",
			nativeLanguage: input.nativeLanguage ?? null,
			source: "runtime",
		},
		isActive: true,
		updatedAt: new Date(),
	});

	let insertedCount = 0;
	for (const item of items) {
		const itemId = crypto.randomUUID();
		const phase = toPracticePhase(item.phase);
		const storedItem: GrammarSessionItem = {
			...item,
			id: itemId,
			phase,
		};
		const inserted = await db
			.insert(grammarPracticeItem)
			.values({
				id: itemId,
				setId,
				grammarTopicId: input.topic.id,
				phase,
				type: storedItem.type,
				difficulty: storedItem.difficulty,
				ruleTitle: storedItem.ruleTitle,
				item: storedItem,
				itemHash: hashPracticeItem(storedItem),
				isActive: true,
				updatedAt: new Date(),
			})
			.onConflictDoNothing()
			.returning({ id: grammarPracticeItem.id });

		insertedCount += inserted.length;
	}

	await db
		.update(grammarPracticeSet)
		.set({ itemCount: insertedCount, updatedAt: new Date() })
		.where(eq(grammarPracticeSet.id, setId));
}

async function getSessionPracticeItems(input: {
	topic: GrammarTopic;
	nativeLanguage?: string | null;
}) {
	let items = await loadPracticePoolItems(
		input.topic.id,
		SESSION_PRACTICE_ITEM_COUNT,
	);

	if (items.length >= SESSION_PRACTICE_ITEM_COUNT) {
		return items;
	}

	await generateRuntimePracticeSet({
		topic: input.topic,
		nativeLanguage: input.nativeLanguage,
		count: 30,
	});

	items = await loadPracticePoolItems(
		input.topic.id,
		SESSION_PRACTICE_ITEM_COUNT,
	);

	if (items.length < SESSION_PRACTICE_ITEM_COUNT) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "NO_PRACTICE_ITEMS",
		});
	}

	return items;
}

async function getResolvedTopic(topicIdOrSlug: string) {
	const [topic] = await db
		.select()
		.from(grammarTopic)
		.where(
			and(
				eq(grammarTopic.id, topicIdOrSlug),
				eq(grammarTopic.isPublished, true),
			),
		)
		.limit(1);

	if (topic) {
		return topic;
	}

	const [topicBySlug] = await db
		.select()
		.from(grammarTopic)
		.where(
			and(
				eq(grammarTopic.slug, topicIdOrSlug),
				eq(grammarTopic.isPublished, true),
			),
		)
		.limit(1);

	return topicBySlug ?? null;
}

function getPhaseAttemptQuality(input: {
	isCorrect: boolean;
	hintUsed: boolean;
}) {
	if (!input.isCorrect) {
		return 1;
	}

	return input.hintUsed ? 4 : 5;
}

async function upsertMistakeBankEntries(input: {
	userId: string;
	session: GrammarSession;
	items: GrammarSessionItem[];
	attempts: GrammarAttempt[];
}) {
	let count = 0;
	const now = new Date();

	for (const attempt of input.attempts) {
		const item = input.items[attempt.itemIndex];
		if (!item || item.phase === "diagnose") {
			continue;
		}

		if (attempt.isCorrect && !attempt.hintUsed) {
			continue;
		}

		count += 1;

		await db
			.insert(grammarMistake)
			.values({
				id: crypto.randomUUID(),
				userId: input.userId,
				grammarTopicId: input.session.grammarTopicId,
				ruleTitle: item.ruleTitle,
				fingerprint: buildGrammarFingerprint(item),
				itemSnapshot: item,
				lastUserAnswer: attempt.userAnswer,
				timesWrong: 1,
				timesRight: 0,
				easeFactor: SM2_INITIAL_EASE_FACTOR,
				intervalDays: 0,
				repetitions: 0,
				nextReviewAt: now,
				lastAttemptAt: now,
				retiredAt: null,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: [grammarMistake.userId, grammarMistake.fingerprint],
				set: {
					grammarTopicId: input.session.grammarTopicId,
					ruleTitle: item.ruleTitle,
					itemSnapshot: item,
					lastUserAnswer: attempt.userAnswer,
					timesWrong: sql`${grammarMistake.timesWrong} + 1`,
					timesRight: 0,
					easeFactor: SM2_INITIAL_EASE_FACTOR,
					intervalDays: 0,
					repetitions: 0,
					nextReviewAt: now,
					lastAttemptAt: now,
					retiredAt: null,
					updatedAt: now,
				},
			});
	}

	return count;
}

function deriveMastery(
	status: GrammarTopicStatus,
	progressRow?: {
		mastery: GrammarMastery;
		status: "not_started" | "in_progress" | "completed";
		progressPercent: number;
	} | null,
): GrammarMastery {
	if (progressRow?.mastery) {
		return progressRow.mastery;
	}

	if (status === "completed") {
		return "mastered";
	}

	if (status === "in_progress") {
		return "learning";
	}

	return "not_started";
}

async function getGrammarCatalogState(userId: string) {
	const topics = await db
		.select()
		.from(grammarTopic)
		.where(eq(grammarTopic.isPublished, true))
		.orderBy(
			asc(grammarTopic.cefrLevel),
			asc(grammarTopic.category),
			asc(grammarTopic.title),
		);

	const topicIds = topics.map((topic) => topic.id);

	const relations =
		topicIds.length > 0
			? await db
					.select()
					.from(grammarTopicRelation)
					.where(inArray(grammarTopicRelation.fromTopicId, topicIds))
			: [];

	const progressRows =
		topicIds.length > 0
			? await db
					.select()
					.from(userGrammarProgress)
					.where(
						and(
							eq(userGrammarProgress.userId, userId),
							inArray(userGrammarProgress.grammarTopicId, topicIds),
						),
					)
			: [];

	const activeSessions =
		topicIds.length > 0
			? await db
					.select({
						id: grammarSession.id,
						grammarTopicId: grammarSession.grammarTopicId,
					})
					.from(grammarSession)
					.where(
						and(
							eq(grammarSession.userId, userId),
							eq(grammarSession.status, "active"),
							isNull(grammarSession.deletedAt),
							inArray(grammarSession.grammarTopicId, topicIds),
						),
					)
			: [];

	const practiceItemCounts =
		topicIds.length > 0
			? await db
					.select({
						grammarTopicId: grammarPracticeItem.grammarTopicId,
						count: sql<number>`count(*)`,
					})
					.from(grammarPracticeItem)
					.innerJoin(
						grammarPracticeSet,
						eq(grammarPracticeSet.id, grammarPracticeItem.setId),
					)
					.where(
						and(
							inArray(grammarPracticeItem.grammarTopicId, topicIds),
							eq(grammarPracticeItem.isActive, true),
							eq(grammarPracticeSet.isActive, true),
						),
					)
					.groupBy(grammarPracticeItem.grammarTopicId)
			: [];

	const [dueMistakesRowResult] = await db
		.select({
			count: sql<number>`count(*)`,
		})
		.from(grammarMistake)
		.where(
			and(
				eq(grammarMistake.userId, userId),
				isNull(grammarMistake.retiredAt),
				sql`${grammarMistake.nextReviewAt} <= now()`,
			),
		);

	const progressByTopicId = new Map(
		progressRows.map((row) => [row.grammarTopicId, row]),
	);
	const activeSessionByTopicId = new Map(
		activeSessions.map((session) => [session.grammarTopicId, session.id]),
	);
	const practiceItemCountByTopicId = new Map(
		practiceItemCounts.map((row) => [row.grammarTopicId, Number(row.count)]),
	);
	const relationMap = new Map<string, typeof relations>();
	for (const relation of relations) {
		const existing = relationMap.get(relation.fromTopicId) ?? [];
		existing.push(relation);
		relationMap.set(relation.fromTopicId, existing);
	}

	const topicStates = topics.map((topic) => {
		const content = topic.content as GrammarTopicContent | null;
		const progressRow = progressByTopicId.get(topic.id) ?? null;
		const hasActiveSession = activeSessionByTopicId.has(topic.id);
		const activeSessionId = activeSessionByTopicId.get(topic.id) ?? null;

		const status: GrammarTopicStatus = progressRow
			? progressRow.status === "completed"
				? "completed"
				: progressRow.status === "in_progress" || hasActiveSession
					? "in_progress"
					: "not_started"
			: hasActiveSession
				? "in_progress"
				: "not_started";

		const progress =
			progressRow?.progressPercent ?? (status === "completed" ? 100 : 0);

		const mastery = deriveMastery(
			status,
			progressRow
				? {
						mastery: progressRow.mastery,
						status: progressRow.status,
						progressPercent: progressRow.progressPercent,
					}
				: null,
		);

		const drillItemCount =
			practiceItemCountByTopicId.get(topic.id) ??
			countLegacyDrillItems(content);

		return {
			id: topic.id,
			slug: topic.slug,
			title: topic.title,
			summary: topic.summary,
			description: getTopicDescription(content, topic.summary),
			level: topic.cefrLevel,
			category: topic.category,
			estimatedMinutes: topic.estimatedMinutes,
			status,
			mastery,
			progress,
			bookmark: progressRow?.bookmark ?? false,
			ruleTitles: getGrammarRuleTitles(content),
			vocabulary: getGrammarVocabulary(content),
			objectives: getGrammarObjectives(content),
			content,
			activeSessionId,
			drillItemCount,
			relations: relationMap.get(topic.id) ?? [],
		};
	});

	const totals = topicStates.reduce(
		(acc, topic) => {
			acc.total += 1;
			acc[topic.status] += 1;
			acc.progressSum += topic.progress;
			if (topic.bookmark) {
				acc.bookmarked += 1;
			}
			return acc;
		},
		{
			total: 0,
			completed: 0,
			in_progress: 0,
			not_started: 0,
			locked: 0,
			bookmarked: 0,
			progressSum: 0,
		},
	);

	const currentTopic =
		topicStates.find((topic) => topic.status === "in_progress") ??
		topicStates.find((topic) => topic.status === "not_started") ??
		topicStates[0] ??
		null;

	return {
		topics: topicStates,
		overview: {
			totalTopics: totals.total,
			completedTopics: totals.completed,
			inProgressTopics: totals.in_progress,
			notStartedTopics: totals.not_started,
			lockedTopics: totals.locked,
			bookmarkedTopics: totals.bookmarked,
			completionRate:
				totals.total > 0
					? Math.round((totals.completed / totals.total) * 100)
					: 0,
			progressAverage:
				totals.total > 0 ? Math.round(totals.progressSum / totals.total) : 0,
			currentTopic:
				currentTopic === null
					? null
					: {
							id: currentTopic.id,
							slug: currentTopic.slug,
							title: currentTopic.title,
							category: currentTopic.category,
							activeSessionId: currentTopic.activeSessionId,
						},
			recommendedTopicId: currentTopic?.id ?? null,
			dueMistakesCount: Number(dueMistakesRowResult?.count ?? 0),
			levelBreakdown: ["A1", "A2", "B1", "B2", "C1", "C2"]
				.map((level) => {
					const levelTopics = topicStates.filter(
						(topic) => topic.level === level,
					);
					if (levelTopics.length === 0) {
						return null;
					}

					return {
						level,
						totalTopics: levelTopics.length,
						completedTopics: levelTopics.filter(
							(topic) => topic.status === "completed",
						).length,
					};
				})
				.filter(Boolean),
			categories: Array.from(
				new Set(topicStates.map((topic) => topic.category)),
			),
		},
	};
}

async function updateProgress(input: {
	userId: string;
	topicId: string;
	scorePercent: number;
	passed: boolean;
}) {
	const now = new Date();
	const [existing] = await db
		.select()
		.from(userGrammarProgress)
		.where(
			and(
				eq(userGrammarProgress.userId, input.userId),
				eq(userGrammarProgress.grammarTopicId, input.topicId),
			),
		)
		.limit(1);

	const mastery: GrammarMastery = input.passed
		? input.scorePercent >= 95
			? "mastered"
			: "confident"
		: "learning";
	const status: "not_started" | "in_progress" | "completed" = input.passed
		? "completed"
		: "in_progress";
	const progressPercent = Math.max(
		existing?.progressPercent ?? 0,
		input.scorePercent,
	);

	if (existing) {
		await db
			.update(userGrammarProgress)
			.set({
				status,
				mastery,
				progressPercent,
				lastPracticedAt: now,
				updatedAt: now,
			})
			.where(eq(userGrammarProgress.id, existing.id));
	} else {
		await db.insert(userGrammarProgress).values({
			id: crypto.randomUUID(),
			userId: input.userId,
			grammarTopicId: input.topicId,
			status,
			mastery,
			progressPercent,
			lastPracticedAt: now,
		});
	}
}

export const grammarRouter = router({
	getOverview: protectedProcedure.query(async ({ ctx }) => {
		const state = await getGrammarCatalogState(ctx.session.user.id);

		return state.overview;
	}),

	getCatalog: protectedProcedure.query(async ({ ctx }) => {
		const state = await getGrammarCatalogState(ctx.session.user.id);

		return {
			overview: state.overview,
			topics: state.topics.map((topic) => ({
				id: topic.id,
				slug: topic.slug,
				title: topic.title,
				description: topic.description,
				level: topic.level,
				category: topic.category,
				summary: topic.summary,
				estimatedMinutes: topic.estimatedMinutes,
				status: topic.status,
				mastery: topic.mastery,
				progress: topic.progress,
				bookmark: topic.bookmark,
				activeSessionId: topic.activeSessionId,
				drillItemCount: topic.drillItemCount,
				ruleTitles: topic.ruleTitles,
				vocabulary: topic.vocabulary,
				objectives: topic.objectives,
			})),
		};
	}),

	getTopic: protectedProcedure
		.input(z.object({ topicId: z.string() }))
		.query(async ({ ctx, input }) => {
			const state = await getGrammarCatalogState(ctx.session.user.id);
			const topicIndex = state.topics.findIndex(
				(topic) => topic.id === input.topicId || topic.slug === input.topicId,
			);

			if (topicIndex === -1) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Grammar topic not found",
				});
			}

			const topic = state.topics[topicIndex];
			if (!topic) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Grammar topic not found",
				});
			}

			return {
				...topic,
				previousTopicId: state.topics[topicIndex - 1]?.id ?? null,
				nextTopicId: state.topics[topicIndex + 1]?.id ?? null,
				prerequisites: topic.relations
					.filter((relation) => relation.kind === "prerequisite")
					.map((relation) =>
						state.topics.find(
							(candidate) => candidate.id === relation.toTopicId,
						),
					)
					.filter((candidate): candidate is (typeof state.topics)[number] =>
						Boolean(candidate),
					),
				relatedTopics: topic.relations
					.filter((relation) => relation.kind === "related")
					.map((relation) =>
						state.topics.find(
							(candidate) => candidate.id === relation.toTopicId,
						),
					)
					.filter((candidate): candidate is (typeof state.topics)[number] =>
						Boolean(candidate),
					),
				nextTopics: topic.relations
					.filter((relation) => relation.kind === "next")
					.map((relation) =>
						state.topics.find(
							(candidate) => candidate.id === relation.toTopicId,
						),
					)
					.filter((candidate): candidate is (typeof state.topics)[number] =>
						Boolean(candidate),
					),
			};
		}),

	startDrillSession: rateLimitedProcedure(10, 60_000)
		.input(
			z.object({
				topicId: z.string(),
				skipTheory: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const resolvedTopic = await getResolvedTopic(input.topicId);
			if (!resolvedTopic) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Grammar topic not found",
				});
			}

			const [existingActive] = await db
				.select()
				.from(grammarSession)
				.where(
					and(
						eq(grammarSession.userId, userId),
						eq(grammarSession.grammarTopicId, resolvedTopic.id),
						eq(grammarSession.status, "active"),
						isNull(grammarSession.deletedAt),
					),
				)
				.limit(1);

			if (existingActive) {
				return { sessionId: existingActive.id };
			}

			const access = await getGrammarAccessSummary(userId);
			if (!access.hasAccess) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "FREE_DAILY_GRAMMAR_LIMIT_REACHED",
				});
			}

			const nativeLanguage = await getUserNativeLanguage(userId);

			try {
				const items = await getSessionPracticeItems({
					topic: resolvedTopic,
					nativeLanguage,
				});

				const sessionId = crypto.randomUUID();

				await db.insert(grammarSession).values({
					id: sessionId,
					userId,
					grammarTopicId: resolvedTopic.id,
					level: resolvedTopic.cefrLevel,
					status: "active",
					phase: "practice",
					items,
				});

				try {
					await recordDailyFeatureUsage({
						userId,
						feature: "grammar_session",
						resourceId: sessionId,
						metadata: {
							topicId: resolvedTopic.id,
						},
					});
				} catch (error) {
					if (!isUnsupportedFeatureUsageValue(error, "grammar_session")) {
						throw error;
					}
				}

				return { sessionId };
			} catch (error) {
				console.error(error);
				if (error instanceof TRPCError) {
					throw error;
				}
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "GENERATION_FAILED",
				});
			}
		}),

	getSession: protectedProcedure
		.input(z.object({ sessionId: z.string() }))
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [session] = await db
				.select()
				.from(grammarSession)
				.where(
					and(
						eq(grammarSession.id, input.sessionId),
						eq(grammarSession.userId, userId),
						isNull(grammarSession.deletedAt),
					),
				)
				.limit(1);

			if (!session) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Grammar drill session not found",
				});
			}

			const attempts = await db
				.select()
				.from(grammarAttempt)
				.where(eq(grammarAttempt.sessionId, input.sessionId))
				.orderBy(asc(grammarAttempt.itemIndex));

			const [topic] = await db
				.select({
					id: grammarTopic.id,
					slug: grammarTopic.slug,
					title: grammarTopic.title,
					summary: grammarTopic.summary,
					level: grammarTopic.cefrLevel,
					category: grammarTopic.category,
					content: grammarTopic.content,
				})
				.from(grammarTopic)
				.where(eq(grammarTopic.id, session.grammarTopicId))
				.limit(1);

			const nativeLanguage = await getUserNativeLanguage(userId);
			const itemIds = ((session.items ?? []) as GrammarSessionItem[]).map(
				(item) => item.id,
			);
			const linkedMistakes =
				itemIds.length > 0
					? await db
							.select({ id: grammarMistake.id })
							.from(grammarMistake)
							.where(
								and(
									eq(grammarMistake.userId, userId),
									inArray(grammarMistake.id, itemIds),
								),
							)
					: [];

			return {
				...session,
				topic: topic ?? null,
				attempts,
				nativeLanguage,
				isMistakeReview:
					itemIds.length > 0 && linkedMistakes.length === itemIds.length,
			};
		}),

	submitDiagnose: rateLimitedProcedure(10, 60_000)
		.input(
			z.object({
				sessionId: z.string(),
				answers: z.array(
					z.object({
						itemIndex: z.number().int().min(0),
						userAnswer: z.string(),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [session] = await db
				.select()
				.from(grammarSession)
				.where(
					and(
						eq(grammarSession.id, input.sessionId),
						eq(grammarSession.userId, userId),
						eq(grammarSession.status, "active"),
						isNull(grammarSession.deletedAt),
					),
				)
				.limit(1);

			if (!session) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Grammar drill session not found",
				});
			}

			const items = (session.items ?? []) as GrammarSessionItem[];
			const diagnoseItems = items.filter((item) => item.phase === "diagnose");
			if (diagnoseItems.length === 0) {
				return {
					phase: "practice" as const,
					diagnoseResult:
						session.diagnoseResult as GrammarDiagnoseResult | null,
				};
			}

			let correct = 0;
			for (const answer of input.answers) {
				const item = items[answer.itemIndex];
				if (!item || item.phase !== "diagnose") {
					continue;
				}

				const userAnswer = answer.userAnswer.trim();
				const isCorrect = matchesCorrectAnswer(userAnswer, item.correctAnswer);
				if (isCorrect) {
					correct += 1;
				}

				await db
					.insert(grammarAttempt)
					.values({
						id: crypto.randomUUID(),
						sessionId: input.sessionId,
						itemIndex: answer.itemIndex,
						itemId: item.id,
						prompt: item.prompt,
						expectedAnswer: stringifyCorrectAnswer(
							item.correctAnswer ?? item.answer ?? "",
						),
						userAnswer,
						isCorrect,
						hintUsed: false,
						phase: item.phase,
						itemType: item.type,
						ruleTitle: item.ruleTitle,
					})
					.onConflictDoUpdate({
						target: [grammarAttempt.sessionId, grammarAttempt.itemIndex],
						set: {
							itemId: item.id,
							prompt: item.prompt,
							expectedAnswer: stringifyCorrectAnswer(
								item.correctAnswer ?? item.answer ?? "",
							),
							userAnswer,
							isCorrect,
							hintUsed: false,
							phase: item.phase,
							itemType: item.type,
							ruleTitle: item.ruleTitle,
						},
					});
			}

			const mix = deriveDiagnoseMix(correct, diagnoseItems.length);
			const diagnoseResult: GrammarDiagnoseResult = {
				correct,
				total: diagnoseItems.length,
				targetDifficultyMix: mix,
			};

			const topic = await getResolvedTopic(session.grammarTopicId);
			if (!topic) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Grammar topic not found",
				});
			}

			const nativeLanguage = await getUserNativeLanguage(userId);

			let generatedPracticeItems: GrammarSessionItem[] = [];
			try {
				const drill = await generateGrammarDrill({
					topic: {
						title: topic.title,
						cefrLevel: topic.cefrLevel,
						category: topic.category,
						content: topic.content as GrammarTopicContent,
					},
					nativeLanguage,
					difficultyMix: mix,
					mode: "practice_only",
				});
				generatedPracticeItems = drill.items.filter(
					(item) => item.phase !== "diagnose",
				);
			} catch (error) {
				console.error(error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "GENERATION_FAILED",
				});
			}

			const nextItems = [...diagnoseItems, ...generatedPracticeItems];

			await db
				.update(grammarSession)
				.set({
					phase: "practice",
					diagnoseResult,
					items: nextItems,
				})
				.where(eq(grammarSession.id, session.id));

			return {
				phase: "practice" as const,
				diagnoseResult,
				items: nextItems,
			};
		}),

	submitAttempt: protectedProcedure
		.input(
			z.object({
				sessionId: z.string(),
				itemIndex: z.number().int().min(0),
				userAnswer: z.string(),
				hintUsed: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const userAnswer = input.userAnswer.trim();

			const [session] = await db
				.select()
				.from(grammarSession)
				.where(
					and(
						eq(grammarSession.id, input.sessionId),
						eq(grammarSession.userId, userId),
						eq(grammarSession.status, "active"),
						isNull(grammarSession.deletedAt),
					),
				)
				.limit(1);

			if (!session) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Grammar drill session not found",
				});
			}

			const items = (session.items ?? []) as GrammarSessionItem[];
			const item = items[input.itemIndex];
			if (!item) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "INVALID_ITEM_INDEX",
				});
			}

			if (item.phase === "diagnose") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "USE_SUBMIT_DIAGNOSE",
				});
			}

			const hintUsed = Boolean(input.hintUsed);
			let isCorrect = false;
			let explanation = item.explanation ?? null;
			let quality = getPhaseAttemptQuality({
				isCorrect: false,
				hintUsed,
			});

			if (
				item.type === "sentence_correction" ||
				item.type === "sentence_building"
			) {
				const grade = await gradeGrammarFreeAnswer({
					item,
					userAnswer,
				});
				isCorrect = grade.isCorrect;
				explanation = grade.feedback;
				quality = grade.quality;
			} else {
				isCorrect = matchesCorrectAnswer(
					userAnswer,
					item.correctAnswer ?? item.answer,
				);
				quality = getPhaseAttemptQuality({ isCorrect, hintUsed });
			}

			const attemptId = crypto.randomUUID();

			await db
				.insert(grammarAttempt)
				.values({
					id: attemptId,
					sessionId: input.sessionId,
					itemIndex: input.itemIndex,
					itemId: item.id,
					prompt: item.prompt,
					expectedAnswer: stringifyCorrectAnswer(
						item.correctAnswer ?? item.answer ?? "",
					),
					userAnswer,
					isCorrect,
					hintUsed,
					phase: item.phase,
					itemType: item.type,
					ruleTitle: item.ruleTitle,
				})
				.onConflictDoUpdate({
					target: [grammarAttempt.sessionId, grammarAttempt.itemIndex],
					set: {
						userAnswer,
						isCorrect,
						itemId: item.id,
						prompt: item.prompt,
						expectedAnswer: stringifyCorrectAnswer(
							item.correctAnswer ?? item.answer ?? "",
						),
						hintUsed,
						phase: item.phase,
						itemType: item.type,
						ruleTitle: item.ruleTitle,
					},
				});

			return {
				attemptId,
				isCorrect,
				correctAnswer: stringifyCorrectAnswer(
					item.correctAnswer ?? item.answer ?? "",
				),
				explanation,
				l1Explanation: item.l1?.explanation ?? null,
				quality,
			};
		}),

	completeSession: protectedProcedure
		.input(
			z.object({
				sessionId: z.string(),
				durationSeconds: z.number().int().min(0).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [session] = await db
				.select()
				.from(grammarSession)
				.where(
					and(
						eq(grammarSession.id, input.sessionId),
						eq(grammarSession.userId, userId),
						isNull(grammarSession.deletedAt),
					),
				)
				.limit(1);

			if (!session) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Grammar drill session not found",
				});
			}

			if (session.status === "completed" && session.summary) {
				return {
					summary: session.summary as GrammarSessionSummary,
					sessionId: session.id,
				};
			}

			const items = (session.items ?? []) as GrammarSessionItem[];
			const practiceItems = items.filter((item) => item.phase !== "diagnose");
			const attempts = await db
				.select()
				.from(grammarAttempt)
				.where(eq(grammarAttempt.sessionId, session.id));

			const attemptByIndex = new Map(
				attempts.map((attempt) => [attempt.itemIndex, attempt]),
			);

			let correct = 0;
			const ruleFailures = new Map<string, number>();

			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				if (!item || item.phase === "diagnose") {
					continue;
				}
				const attempt = attemptByIndex.get(i);
				if (attempt?.isCorrect) {
					correct += 1;
				} else {
					const count = ruleFailures.get(item.ruleTitle) ?? 0;
					ruleFailures.set(item.ruleTitle, count + 1);
				}
			}

			const total = practiceItems.length;
			const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;
			const mistakeBankCount = await upsertMistakeBankEntries({
				userId,
				session,
				items,
				attempts,
			});
			const hintsUsed = attempts.filter((attempt) => attempt.hintUsed).length;

			const summary: GrammarSessionSummary = {
				totalItems: total,
				correctCount: correct,
				incorrectCount: total - correct,
				scorePercent,
				weakRules: Array.from(ruleFailures.entries())
					.sort((a, b) => b[1] - a[1])
					.slice(0, 3)
					.map(([rule]) => rule),
				hintsUsed,
				mistakeBankCount,
				diagnoseScorePercent: session.diagnoseResult
					? Math.round(
							(session.diagnoseResult.correct /
								Math.max(session.diagnoseResult.total, 1)) *
								100,
						)
					: undefined,
				phaseBreakdown: calculatePhaseBreakdown(practiceItems),
			};

			await db
				.update(grammarSession)
				.set({
					status: "completed",
					phase: "completed",
					summary,
					hintsUsed,
					durationSeconds: input.durationSeconds,
					completedAt: new Date(),
				})
				.where(eq(grammarSession.id, session.id));

			await updateProgress({
				userId,
				topicId: session.grammarTopicId,
				scorePercent,
				passed: scorePercent >= PASSING_SCORE,
			});

			recordActivity(userId, "grammar", input.durationSeconds).catch(
				console.error,
			);

			return { summary, sessionId: session.id };
		}),

	abandonSession: protectedProcedure
		.input(z.object({ sessionId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			await db
				.update(grammarSession)
				.set({ status: "abandoned" })
				.where(
					and(
						eq(grammarSession.id, input.sessionId),
						eq(grammarSession.userId, userId),
						eq(grammarSession.status, "active"),
					),
				);

			return { success: true };
		}),

	getMistakeBank: protectedProcedure
		.input(
			z.object({
				dueOnly: z.boolean().default(true),
				limit: z.number().int().min(1).max(50).default(20),
			}),
		)
		.query(async ({ ctx, input }) => {
			const filters = [
				eq(grammarMistake.userId, ctx.session.user.id),
				isNull(grammarMistake.retiredAt),
			];

			if (input.dueOnly) {
				filters.push(sql`${grammarMistake.nextReviewAt} <= now()`);
			}

			return db
				.select()
				.from(grammarMistake)
				.where(and(...filters))
				.orderBy(asc(grammarMistake.nextReviewAt))
				.limit(input.limit);
		}),

	startMistakeReview: protectedProcedure
		.input(
			z.object({
				size: z.number().int().min(1).max(20).default(8),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const dueMistakes = await db
				.select()
				.from(grammarMistake)
				.where(
					and(
						eq(grammarMistake.userId, ctx.session.user.id),
						isNull(grammarMistake.retiredAt),
						sql`${grammarMistake.nextReviewAt} <= now()`,
					),
				)
				.orderBy(asc(grammarMistake.nextReviewAt))
				.limit(input.size);

			if (dueMistakes.length === 0) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "NO_MISTAKES_DUE",
				});
			}

			const firstMistake = dueMistakes[0];
			if (!firstMistake) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "NO_MISTAKES_DUE",
				});
			}

			const sessionId = crypto.randomUUID();
			const items = dueMistakes.map((mistake) => ({
				...mistake.itemSnapshot,
				id: mistake.id,
			}));

			await db.insert(grammarSession).values({
				id: sessionId,
				userId: ctx.session.user.id,
				grammarTopicId: firstMistake.grammarTopicId,
				status: "active",
				phase: "practice",
				items,
			});

			return {
				sessionId,
				count: dueMistakes.length,
			};
		}),

	reviewMistakeAnswer: protectedProcedure
		.input(
			z.object({
				mistakeId: z.string(),
				quality: z.number().int().min(0).max(5),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [mistake] = await db
				.select()
				.from(grammarMistake)
				.where(
					and(
						eq(grammarMistake.id, input.mistakeId),
						eq(grammarMistake.userId, ctx.session.user.id),
					),
				)
				.limit(1);

			if (!mistake) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Grammar mistake not found",
				});
			}

			const review = applySm2Review({
				repetition: mistake.repetitions,
				intervalDays: mistake.intervalDays,
				easeFactor: mistake.easeFactor,
				lapses: mistake.timesWrong,
				quality: input.quality,
			});
			const nextTimesRight = input.quality >= 3 ? mistake.timesRight + 1 : 0;
			const shouldRetire = input.quality >= 4 && nextTimesRight >= 3;

			await db
				.update(grammarMistake)
				.set({
					timesWrong: review.lapses,
					timesRight: nextTimesRight,
					easeFactor: review.easeFactor,
					intervalDays: review.intervalDays,
					repetitions: review.repetition,
					nextReviewAt: review.nextReviewAt,
					lastAttemptAt: review.lastReviewedAt,
					retiredAt: shouldRetire ? new Date() : null,
					updatedAt: new Date(),
				})
				.where(eq(grammarMistake.id, mistake.id));

			return {
				nextReviewAt: review.nextReviewAt,
				retired: shouldRetire,
			};
		}),

	getHistory: protectedProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(50).default(10),
				topicId: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const filters = [
				eq(grammarSession.userId, userId),
				isNull(grammarSession.deletedAt),
			];
			if (input.topicId) {
				filters.push(eq(grammarSession.grammarTopicId, input.topicId));
			}

			const sessions = await db
				.select({
					id: grammarSession.id,
					grammarTopicId: grammarSession.grammarTopicId,
					level: grammarSession.level,
					status: grammarSession.status,
					phase: grammarSession.phase,
					summary: grammarSession.summary,
					createdAt: grammarSession.createdAt,
					completedAt: grammarSession.completedAt,
				})
				.from(grammarSession)
				.where(and(...filters))
				.orderBy(desc(grammarSession.createdAt))
				.limit(input.limit);

			return sessions;
		}),
});

export type GrammarRouter = typeof grammarRouter;
