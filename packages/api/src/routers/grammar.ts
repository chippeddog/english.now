import {
	and,
	asc,
	db,
	desc,
	eq,
	grammarAttempt,
	grammarSession,
	grammarTopic,
	grammarTopicRelation,
	inArray,
	isNull,
	userGrammarProgress,
} from "@english.now/db";
import type {
	GrammarSessionItem,
	GrammarSessionSummary,
	GrammarTopicContent,
} from "@english.now/db/schema/grammar";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, rateLimitedProcedure, router } from "../index";
import { recordActivity } from "../services/record-activity";

type GrammarTopicStatus =
	| "completed"
	| "in_progress"
	| "not_started"
	| "locked";
type GrammarMastery = "not_started" | "learning" | "confident" | "mastered";

const MAX_DRILL_ITEMS = 10;
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

function buildDrillItems(
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
				prompt,
				answer: example.highlight,
				ruleTitle: rule.title,
				explanation: example.note ?? rule.explanation,
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

	return items.slice(0, MAX_DRILL_ITEMS);
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

	const [relations, progressRows, activeSessions] = await Promise.all([
		topicIds.length > 0
			? db
					.select()
					.from(grammarTopicRelation)
					.where(inArray(grammarTopicRelation.fromTopicId, topicIds))
			: [],
		topicIds.length > 0
			? db
					.select()
					.from(userGrammarProgress)
					.where(
						and(
							eq(userGrammarProgress.userId, userId),
							inArray(userGrammarProgress.grammarTopicId, topicIds),
						),
					)
			: [],
		topicIds.length > 0
			? db
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
			: [],
	]);

	const progressByTopicId = new Map(
		progressRows.map((row) => [row.grammarTopicId, row]),
	);
	const activeSessionByTopicId = new Map(
		activeSessions.map((session) => [session.grammarTopicId, session.id]),
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

		const drillItemCount = (() => {
			const rules = content?.rules ?? [];
			let count = 0;
			for (const rule of rules) {
				if (!rule?.examples) continue;
				count += rule.examples.filter(
					(example) => example?.sentence && example.highlight,
				).length;
			}
			return Math.min(count, MAX_DRILL_ITEMS);
		})();

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
					.filter(Boolean),
				relatedTopics: topic.relations
					.filter((relation) => relation.kind === "related")
					.map((relation) =>
						state.topics.find(
							(candidate) => candidate.id === relation.toTopicId,
						),
					)
					.filter(Boolean),
				nextTopics: topic.relations
					.filter((relation) => relation.kind === "next")
					.map((relation) =>
						state.topics.find(
							(candidate) => candidate.id === relation.toTopicId,
						),
					)
					.filter(Boolean),
			};
		}),

	startDrillSession: rateLimitedProcedure(10, 60_000)
		.input(z.object({ topicId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [topic] = await db
				.select()
				.from(grammarTopic)
				.where(
					and(
						eq(grammarTopic.id, input.topicId),
						eq(grammarTopic.isPublished, true),
					),
				)
				.limit(1);

			const [topicBySlug] = topic
				? [topic]
				: await db
						.select()
						.from(grammarTopic)
						.where(
							and(
								eq(grammarTopic.slug, input.topicId),
								eq(grammarTopic.isPublished, true),
							),
						)
						.limit(1);

			const resolvedTopic = topic ?? topicBySlug ?? null;
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

			const items = buildDrillItems(
				resolvedTopic.content as GrammarTopicContent | null,
			);

			if (items.length === 0) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "NO_DRILL_ITEMS_AVAILABLE",
				});
			}

			const sessionId = crypto.randomUUID();

			await db.insert(grammarSession).values({
				id: sessionId,
				userId,
				grammarTopicId: resolvedTopic.id,
				level: resolvedTopic.cefrLevel,
				status: "active",
				items,
			});

			return { sessionId };
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

			return {
				...session,
				topic: topic ?? null,
				attempts,
			};
		}),

	submitAttempt: protectedProcedure
		.input(
			z.object({
				sessionId: z.string(),
				itemIndex: z.number().int().min(0),
				userAnswer: z.string(),
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

			const isCorrect =
				normalizeAnswer(userAnswer) === normalizeAnswer(item.answer);
			const attemptId = crypto.randomUUID();

			await db
				.insert(grammarAttempt)
				.values({
					id: attemptId,
					sessionId: input.sessionId,
					itemIndex: input.itemIndex,
					itemId: item.id,
					prompt: item.prompt,
					expectedAnswer: item.answer,
					userAnswer,
					isCorrect,
					ruleTitle: item.ruleTitle,
				})
				.onConflictDoUpdate({
					target: [grammarAttempt.sessionId, grammarAttempt.itemIndex],
					set: {
						userAnswer,
						isCorrect,
						itemId: item.id,
						prompt: item.prompt,
						expectedAnswer: item.answer,
						ruleTitle: item.ruleTitle,
					},
				});

			return {
				attemptId,
				isCorrect,
				correctAnswer: item.answer,
				explanation: item.explanation ?? null,
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
				const attempt = attemptByIndex.get(i);
				if (attempt?.isCorrect) {
					correct += 1;
				} else if (item) {
					const count = ruleFailures.get(item.ruleTitle) ?? 0;
					ruleFailures.set(item.ruleTitle, count + 1);
				}
			}

			const total = items.length;
			const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;

			const summary: GrammarSessionSummary = {
				totalItems: total,
				correctCount: correct,
				incorrectCount: total - correct,
				scorePercent,
				weakRules: Array.from(ruleFailures.entries())
					.sort((a, b) => b[1] - a[1])
					.slice(0, 3)
					.map(([rule]) => rule),
			};

			await db
				.update(grammarSession)
				.set({
					status: "completed",
					summary,
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
