import type { CurriculumLessonContent, ExerciseItem } from "@english.now/db";
import { FREE_LESSON_FREE_UNIT_COUNT } from "@english.now/shared/feature-limit-config";
import {
	and,
	asc,
	course,
	courseVersion,
	curriculumLesson,
	curriculumUnit,
	db,
	desc,
	enrollment,
	eq,
	inArray,
	lessonAttempt,
	lessonCompletion,
	userProfile,
} from "@english.now/db";
import { grammarTopic, lessonGrammarTopic } from "@english.now/db/schema/grammar";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { getLessonAccessSummary } from "../services/feature-gating";
import { generateLessonExercises } from "../services/generate-lesson-exercises";
import { recordDailyFeatureUsage } from "../services/feature-usage";
import { recordActivity } from "../services/record-activity";

// ─── Status Computation ─────────────────────────────────────────────────────

type LessonStatus = "completed" | "current" | "available" | "locked";
type UnitStatus = "completed" | "active" | "locked";

function computeStatuses(
	units: {
		id: string;
		order: number;
		lessons: { id: string; order: number }[];
	}[],
	completedLessonIds: Set<string>,
) {
	const sorted = [...units].sort((a, b) => a.order - b.order);
	let foundActiveUnit = false;

	const result: {
		unitId: string;
		unitStatus: UnitStatus;
		unitProgress: number;
		lessons: { lessonId: string; status: LessonStatus }[];
	}[] = [];

	for (const u of sorted) {
		const sortedLessons = [...u.lessons].sort((a, b) => a.order - b.order);
		const completedCount = sortedLessons.filter((l) =>
			completedLessonIds.has(l.id),
		).length;
		const allCompleted =
			sortedLessons.length > 0 && completedCount === sortedLessons.length;
		const unitProgress =
			sortedLessons.length > 0
				? Math.round((completedCount / sortedLessons.length) * 100)
				: 0;

		let unitStatus: UnitStatus;
		if (allCompleted) {
			unitStatus = "completed";
		} else if (!foundActiveUnit) {
			unitStatus = "active";
			foundActiveUnit = true;
		} else {
			unitStatus = "locked";
		}

		let foundCurrentLesson = false;
		const lessonStatuses: { lessonId: string; status: LessonStatus }[] = [];

		for (const l of sortedLessons) {
			if (completedLessonIds.has(l.id)) {
				lessonStatuses.push({ lessonId: l.id, status: "completed" });
			} else if (unitStatus === "active" && !foundCurrentLesson) {
				lessonStatuses.push({ lessonId: l.id, status: "current" });
				foundCurrentLesson = true;
			} else if (unitStatus === "active") {
				lessonStatuses.push({ lessonId: l.id, status: "available" });
			} else {
				lessonStatuses.push({ lessonId: l.id, status: "locked" });
			}
		}

		result.push({
			unitId: u.id,
			unitStatus,
			unitProgress,
			lessons: lessonStatuses,
		});
	}

	return result;
}

function resolveLessonGate(input: {
	isPro: boolean;
	unitOrder: number;
	baseStatus: LessonStatus;
	isCompleted: boolean;
	hasActiveAttempt: boolean;
	dailyNewLessonLimitReached: boolean;
}) {
	if (input.isCompleted) {
		return {
			status: "completed" as const,
			lockReason: null,
			replayAllowed: input.unitOrder <= FREE_LESSON_FREE_UNIT_COUNT || input.isPro,
		};
	}

	if (input.hasActiveAttempt) {
		return {
			status: "current" as const,
			lockReason: null,
			replayAllowed: false,
		};
	}

	if (!input.isPro && input.unitOrder > FREE_LESSON_FREE_UNIT_COUNT) {
		return {
			status: "locked" as const,
			lockReason: "free_unit_locked" as const,
			replayAllowed: false,
		};
	}

	if (input.baseStatus === "locked") {
		return {
			status: "locked" as const,
			lockReason: "curriculum_locked" as const,
			replayAllowed: false,
		};
	}

	if (
		!input.isPro &&
		input.dailyNewLessonLimitReached &&
		(input.baseStatus === "current" || input.baseStatus === "available")
	) {
		return {
			status: "locked" as const,
			lockReason: "daily_new_lesson_limit" as const,
			replayAllowed: false,
		};
	}

	return {
		status: input.baseStatus,
		lockReason: null,
		replayAllowed: false,
	};
}

async function getGrammarTopicsByLessonIds(lessonIds: string[]) {
	if (lessonIds.length === 0) {
		return new Map<
			string,
			Array<{
				id: string;
				slug: string;
				title: string;
				summary: string;
				cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
				category: string;
				kind: "teach" | "practice" | "review";
				sortOrder: number;
			}>
		>();
	}

	const rows = await db
		.select({
			lessonId: lessonGrammarTopic.lessonId,
			kind: lessonGrammarTopic.kind,
			sortOrder: lessonGrammarTopic.sortOrder,
			id: grammarTopic.id,
			slug: grammarTopic.slug,
			title: grammarTopic.title,
			summary: grammarTopic.summary,
			cefrLevel: grammarTopic.cefrLevel,
			category: grammarTopic.category,
		})
		.from(lessonGrammarTopic)
		.innerJoin(grammarTopic, eq(grammarTopic.id, lessonGrammarTopic.grammarTopicId))
		.where(inArray(lessonGrammarTopic.lessonId, lessonIds))
		.orderBy(asc(lessonGrammarTopic.lessonId), asc(lessonGrammarTopic.sortOrder));

	const topicsByLessonId = new Map<
		string,
		Array<{
			id: string;
			slug: string;
			title: string;
			summary: string;
			cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
			category: string;
			kind: "teach" | "practice" | "review";
			sortOrder: number;
		}>
	>();

	for (const row of rows) {
		const existing = topicsByLessonId.get(row.lessonId) ?? [];
		existing.push({
			id: row.id,
			slug: row.slug,
			title: row.title,
			summary: row.summary,
			cefrLevel: row.cefrLevel,
			category: row.category,
			kind: row.kind,
			sortOrder: row.sortOrder,
		});
		topicsByLessonId.set(row.lessonId, existing);
	}

	return topicsByLessonId;
}

// ─── Router ─────────────────────────────────────────────────────────────────

export const contentRouter = router({
	getEnrollment: protectedProcedure.query(async ({ ctx }) => {
		const [e] = await db
			.select({
				id: enrollment.id,
				status: enrollment.status,
				courseVersionId: enrollment.courseVersionId,
			})
			.from(enrollment)
			.where(eq(enrollment.userId, ctx.session.user.id))
			.limit(1);

		return e ?? null;
	}),

	enroll: protectedProcedure
		.input(z.object({ level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]) }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [existing] = await db
				.select({ id: enrollment.id })
				.from(enrollment)
				.where(eq(enrollment.userId, userId))
				.limit(1);

			if (existing) {
				return {
					enrollmentId: existing.id,
					status: "already_enrolled" as const,
				};
			}

			const [cv] = await db
				.select({ id: courseVersion.id })
				.from(courseVersion)
				.innerJoin(course, eq(course.id, courseVersion.courseId))
				.where(
					and(
						eq(course.level, input.level),
						eq(course.isActive, true),
						eq(courseVersion.status, "published"),
					),
				)
				.orderBy(desc(courseVersion.version))
				.limit(1);

			if (!cv) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: `No published course found for level ${input.level}`,
				});
			}

			const enrollmentId = crypto.randomUUID();
			await db.insert(enrollment).values({
				id: enrollmentId,
				userId,
				courseVersionId: cv.id,
				status: "active",
			});

			return { enrollmentId, status: "enrolled" as const };
		}),

	getCourse: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;
		const lessonAccess = await getLessonAccessSummary(userId);

		const [e] = await db
			.select()
			.from(enrollment)
			.where(
				and(eq(enrollment.userId, userId), eq(enrollment.status, "active")),
			)
			.limit(1);

		if (!e) return null;

		const [cv] = await db
			.select()
			.from(courseVersion)
			.where(eq(courseVersion.id, e.courseVersionId))
			.limit(1);

		if (!cv) return null;

		const [c] = await db
			.select()
			.from(course)
			.where(eq(course.id, cv.courseId))
			.limit(1);

		if (!c) return null;

		const units = await db
			.select()
			.from(curriculumUnit)
			.where(eq(curriculumUnit.courseVersionId, cv.id))
			.orderBy(asc(curriculumUnit.order));

		const unitIds = units.map((u) => u.id);

		const lessons =
			unitIds.length > 0
				? await db
						.select()
						.from(curriculumLesson)
						.where(inArray(curriculumLesson.unitId, unitIds))
						.orderBy(asc(curriculumLesson.unitId), asc(curriculumLesson.order))
				: [];

		const completions = await db
			.select({ lessonId: lessonCompletion.lessonId })
			.from(lessonCompletion)
			.where(eq(lessonCompletion.enrollmentId, e.id));
		const activeAttempts = await db
			.select({
				lessonId: lessonAttempt.lessonId,
				attemptId: lessonAttempt.id,
			})
			.from(lessonAttempt)
			.where(
				and(
					eq(lessonAttempt.userId, userId),
					eq(lessonAttempt.status, "active"),
				),
			);

		const completedLessonIds = new Set(completions.map((c) => c.lessonId));
		const activeAttemptByLessonId = new Map(
			activeAttempts.map((attempt) => [attempt.lessonId, attempt.attemptId]),
		);

		const lessonsByUnit = new Map<string, typeof lessons>();
		for (const l of lessons) {
			const existing = lessonsByUnit.get(l.unitId) ?? [];
			existing.push(l);
			lessonsByUnit.set(l.unitId, existing);
		}

		const unitsWithLessons = units.map((u) => ({
			id: u.id,
			order: u.order,
			lessons: (lessonsByUnit.get(u.id) ?? []).map((l) => ({
				id: l.id,
				order: l.order,
			})),
		}));

		const statuses = computeStatuses(unitsWithLessons, completedLessonIds);
		const statusMap = new Map(statuses.map((s) => [s.unitId, s]));

		const totalLessons = lessons.length;
		const totalCompleted = completedLessonIds.size;
		const overallProgress =
			totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;
		const grammarTopicsByLessonId = await getGrammarTopicsByLessonIds(
			lessons.map((lesson) => lesson.id),
		);

		return {
			enrollmentId: e.id,
			level: c.level,
			title: c.title,
			progress: overallProgress,
			access: lessonAccess,
			units: units.map((u) => {
				const s = statusMap.get(u.id);
				const unitLessons = lessonsByUnit.get(u.id) ?? [];
				const lessonStatusMap = new Map(
					(s?.lessons ?? []).map((ls) => [ls.lessonId, ls.status]),
				);
				const isFreeLockedUnit =
					!lessonAccess.isPro && u.order > FREE_LESSON_FREE_UNIT_COUNT;

				return {
					id: u.id,
					title: u.title,
					description: u.description,
					order: u.order,
					status: isFreeLockedUnit ? "locked" : (s?.unitStatus ?? "locked"),
					lockReason: isFreeLockedUnit ? "free_unit_locked" : null,
					unlockMessage: isFreeLockedUnit
						? "Upgrade to unlock this unit."
						: undefined,
					progress: s?.unitProgress ?? 0,
					lessons: unitLessons.map((l) => ({
						...resolveLessonGate({
							isPro: lessonAccess.isPro,
							unitOrder: u.order,
							baseStatus: lessonStatusMap.get(l.id) ?? "locked",
							isCompleted: completedLessonIds.has(l.id),
							hasActiveAttempt: activeAttemptByLessonId.has(l.id),
							dailyNewLessonLimitReached:
								!lessonAccess.newLessonStarts.hasAccess,
						}),
						id: l.id,
						title: l.title,
						subtitle: l.subtitle,
						type: l.blockType,
						lessonType: l.lessonType ?? blockTypeToLessonType(l.blockType),
						progress: completedLessonIds.has(l.id) ? 100 : 0,
						activeAttemptId: activeAttemptByLessonId.get(l.id) ?? null,
						content: l.content,
						grammarTopics: grammarTopicsByLessonId.get(l.id) ?? [],
					})),
				};
			}),
		};
	}),

	getLesson: protectedProcedure
		.input(z.object({ lessonId: z.string() }))
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [lessonRow] = await db
				.select()
				.from(curriculumLesson)
				.where(eq(curriculumLesson.id, input.lessonId))
				.limit(1);

			if (!lessonRow) return null;

			const [unitRow] = await db
				.select({
					id: curriculumUnit.id,
					order: curriculumUnit.order,
				})
				.from(curriculumUnit)
				.where(eq(curriculumUnit.id, lessonRow.unitId))
				.limit(1);

			if (!unitRow) return null;

			const [enrollmentRow] = await db
				.select({
					id: enrollment.id,
					courseVersionId: enrollment.courseVersionId,
				})
				.from(enrollment)
				.where(
					and(eq(enrollment.userId, userId), eq(enrollment.status, "active")),
				)
				.limit(1);

			if (!enrollmentRow) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "No active enrollment",
				});
			}

			const courseUnits = await db
				.select({
					id: curriculumUnit.id,
					order: curriculumUnit.order,
				})
				.from(curriculumUnit)
				.where(eq(curriculumUnit.courseVersionId, enrollmentRow.courseVersionId))
				.orderBy(asc(curriculumUnit.order));
			const courseUnitIds = courseUnits.map((unit) => unit.id);
			const courseLessons =
				courseUnitIds.length > 0
					? await db
							.select({
								id: curriculumLesson.id,
								unitId: curriculumLesson.unitId,
								order: curriculumLesson.order,
							})
							.from(curriculumLesson)
							.where(inArray(curriculumLesson.unitId, courseUnitIds))
							.orderBy(asc(curriculumLesson.unitId), asc(curriculumLesson.order))
					: [];

			const [completions, activeAttemptRow, lessonAccess] = await Promise.all([
				db
					.select({ lessonId: lessonCompletion.lessonId })
					.from(lessonCompletion)
					.where(eq(lessonCompletion.enrollmentId, enrollmentRow.id)),
				db
					.select({ id: lessonAttempt.id })
					.from(lessonAttempt)
					.where(
						and(
							eq(lessonAttempt.userId, userId),
							eq(lessonAttempt.lessonId, input.lessonId),
							eq(lessonAttempt.status, "active"),
						),
					)
					.limit(1)
					.then((rows) => rows[0] ?? null),
				getLessonAccessSummary(userId),
			]);
			const completedLessonIds = new Set(completions.map((item) => item.lessonId));
			const lessonsByUnit = new Map<string, Array<{ id: string; order: number }>>();
			for (const lesson of courseLessons) {
				const existing = lessonsByUnit.get(lesson.unitId) ?? [];
				existing.push({ id: lesson.id, order: lesson.order });
				lessonsByUnit.set(lesson.unitId, existing);
			}
			const statuses = computeStatuses(
				courseUnits.map((unit) => ({
					id: unit.id,
					order: unit.order,
					lessons: lessonsByUnit.get(unit.id) ?? [],
				})),
				completedLessonIds,
			);
			const statusMap = new Map(statuses.map((status) => [status.unitId, status]));
			const lessonStatusMap = new Map<string, LessonStatus>();
			for (const unitStatus of statusMap.values()) {
				for (const lessonStatus of unitStatus.lessons) {
					lessonStatusMap.set(lessonStatus.lessonId, lessonStatus.status);
				}
			}

			const lessonState = resolveLessonGate({
				isPro: lessonAccess.isPro,
				unitOrder: unitRow.order,
				baseStatus: lessonStatusMap.get(input.lessonId) ?? "locked",
				isCompleted: completedLessonIds.has(input.lessonId),
				hasActiveAttempt: Boolean(activeAttemptRow),
				dailyNewLessonLimitReached: !lessonAccess.newLessonStarts.hasAccess,
			});

			if (lessonState.status === "locked") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: lessonState.lockReason ?? "LESSON_LOCKED",
					cause: {
						lockReason: lessonState.lockReason,
						access: lessonAccess,
					},
				});
			}

			const grammarTopicsByLessonId = await getGrammarTopicsByLessonIds([
				lessonRow.id,
			]);

			return {
				id: lessonRow.id,
				title: lessonRow.title,
				subtitle: lessonRow.subtitle,
				type: lessonRow.blockType,
				lessonType:
					lessonRow.lessonType ?? blockTypeToLessonType(lessonRow.blockType),
				content: lessonRow.content,
				grammarTopics: grammarTopicsByLessonId.get(lessonRow.id) ?? [],
				access: {
					...lessonState,
					activeAttemptId: activeAttemptRow?.id ?? null,
				},
			};
		}),

	startLesson: protectedProcedure
		.input(z.object({ lessonId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [e] = await db
				.select({
					id: enrollment.id,
					courseVersionId: enrollment.courseVersionId,
				})
				.from(enrollment)
				.where(
					and(eq(enrollment.userId, userId), eq(enrollment.status, "active")),
				)
				.limit(1);

			if (!e) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "No active enrollment",
				});
			}

			const [existingAttempt] = await db
				.select()
				.from(lessonAttempt)
				.where(
					and(
						eq(lessonAttempt.lessonId, input.lessonId),
						eq(lessonAttempt.userId, userId),
						eq(lessonAttempt.status, "active"),
					),
				)
				.limit(1);

			if (existingAttempt) {
				return {
					attemptId: existingAttempt.id,
					exercises: stripAnswers(existingAttempt.exercises as ExerciseItem[]),
					currentIndex: existingAttempt.currentIndex,
					totalCount: existingAttempt.totalCount,
					correctCount: existingAttempt.correctCount,
				};
			}

			const [lessonRecord] = await db
				.select()
				.from(curriculumLesson)
				.where(eq(curriculumLesson.id, input.lessonId))
				.limit(1);

			if (!lessonRecord) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Lesson not found",
				});
			}

			const [unitRow] = await db
				.select({
					id: curriculumUnit.id,
					order: curriculumUnit.order,
				})
				.from(curriculumUnit)
				.where(eq(curriculumUnit.id, lessonRecord.unitId))
				.limit(1);

			if (!unitRow) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Unit not found",
				});
			}

			const courseUnits = await db
				.select({
					id: curriculumUnit.id,
					order: curriculumUnit.order,
				})
				.from(curriculumUnit)
				.where(eq(curriculumUnit.courseVersionId, e.courseVersionId))
				.orderBy(asc(curriculumUnit.order));
			const courseUnitIds = courseUnits.map((unit) => unit.id);
			const courseLessons =
				courseUnitIds.length > 0
					? await db
							.select({
								id: curriculumLesson.id,
								unitId: curriculumLesson.unitId,
								order: curriculumLesson.order,
							})
							.from(curriculumLesson)
							.where(inArray(curriculumLesson.unitId, courseUnitIds))
							.orderBy(asc(curriculumLesson.unitId), asc(curriculumLesson.order))
					: [];

			const [completions, lessonAccess] = await Promise.all([
				db
					.select({ lessonId: lessonCompletion.lessonId })
					.from(lessonCompletion)
					.where(eq(lessonCompletion.enrollmentId, e.id)),
				getLessonAccessSummary(userId),
			]);
			const completedLessonIds = new Set(completions.map((item) => item.lessonId));
			const lessonsByUnit = new Map<string, Array<{ id: string; order: number }>>();
			for (const lesson of courseLessons) {
				const existing = lessonsByUnit.get(lesson.unitId) ?? [];
				existing.push({ id: lesson.id, order: lesson.order });
				lessonsByUnit.set(lesson.unitId, existing);
			}
			const statuses = computeStatuses(
				courseUnits.map((unit) => ({
					id: unit.id,
					order: unit.order,
					lessons: lessonsByUnit.get(unit.id) ?? [],
				})),
				completedLessonIds,
			);
			const statusMap = new Map(statuses.map((status) => [status.unitId, status]));
			const lessonStatusMap = new Map<string, LessonStatus>();
			for (const unitStatus of statusMap.values()) {
				for (const lessonStatus of unitStatus.lessons) {
					lessonStatusMap.set(lessonStatus.lessonId, lessonStatus.status);
				}
			}
			const lessonState = resolveLessonGate({
				isPro: lessonAccess.isPro,
				unitOrder: unitRow.order,
				baseStatus: lessonStatusMap.get(input.lessonId) ?? "locked",
				isCompleted: completedLessonIds.has(input.lessonId),
				hasActiveAttempt: false,
				dailyNewLessonLimitReached: !lessonAccess.newLessonStarts.hasAccess,
			});

			if (lessonState.status === "locked") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: lessonState.lockReason ?? "LESSON_LOCKED",
					cause: {
						lockReason: lessonState.lockReason,
						access: lessonAccess,
					},
				});
			}

			const content = lessonRecord.content as CurriculumLessonContent | null;
			if (!content) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Lesson has no content",
				});
			}

			const [profile] = await db
				.select({ nativeLanguage: userProfile.nativeLanguage })
				.from(userProfile)
				.where(eq(userProfile.userId, userId))
				.limit(1);

			const effectiveLessonType =
				lessonRecord.lessonType ??
				blockTypeToLessonType(lessonRecord.blockType);

			const exercises = await generateLessonExercises(
				lessonRecord.title,
				effectiveLessonType,
				content,
				profile?.nativeLanguage ?? "uk",
			);

			const attemptId = crypto.randomUUID();
			await db.insert(lessonAttempt).values({
				id: attemptId,
				enrollmentId: e.id,
				lessonId: input.lessonId,
				userId,
				exercises,
				currentIndex: 0,
				totalCount: exercises.length,
				correctCount: 0,
				status: "active",
			});

			if (!lessonAccess.isPro && !completedLessonIds.has(input.lessonId)) {
				await recordDailyFeatureUsage({
					userId,
					feature: "lesson_start",
					resourceId: input.lessonId,
					metadata: {
						unitId: unitRow.id,
					},
				});
			}

			return {
				attemptId,
				exercises: stripAnswers(exercises),
				currentIndex: 0,
				totalCount: exercises.length,
				correctCount: 0,
			};
		}),

	submitAnswer: protectedProcedure
		.input(
			z.object({
				attemptId: z.string(),
				exerciseId: z.string(),
				answer: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [attempt] = await db
				.select()
				.from(lessonAttempt)
				.where(
					and(
						eq(lessonAttempt.id, input.attemptId),
						eq(lessonAttempt.userId, userId),
					),
				)
				.limit(1);

			if (!attempt) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Attempt not found",
				});
			}

			if (attempt.status !== "active") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Attempt is already completed",
				});
			}

			const exercises = attempt.exercises as ExerciseItem[];
			const exercise = exercises.find((e) => e.id === input.exerciseId);

			if (!exercise) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Exercise not found",
				});
			}

			if (exercise.userAnswer !== undefined) {
				const prevCorrectStr = Array.isArray(exercise.correctAnswer)
					? (exercise.correctAnswer[0] ?? "")
					: exercise.correctAnswer;
				return {
					isCorrect: exercise.isCorrect ?? false,
					correctAnswer: prevCorrectStr,
					explanation: exercise.explanation,
				};
			}

			const correctStr = Array.isArray(exercise.correctAnswer)
				? (exercise.correctAnswer[0] ?? "")
				: exercise.correctAnswer;
			const isCorrect =
				input.answer.trim().toLowerCase() === correctStr.trim().toLowerCase();

			exercise.userAnswer = input.answer;
			exercise.isCorrect = isCorrect;

			const newCorrectCount = isCorrect
				? attempt.correctCount + 1
				: attempt.correctCount;
			const newIndex = Math.min(attempt.currentIndex + 1, attempt.totalCount);

			await db
				.update(lessonAttempt)
				.set({
					exercises,
					currentIndex: newIndex,
					correctCount: newCorrectCount,
				})
				.where(eq(lessonAttempt.id, input.attemptId));

			return {
				isCorrect,
				correctAnswer: correctStr,
				explanation: exercise.explanation,
			};
		}),

	completeLesson: protectedProcedure
		.input(
			z.object({
				attemptId: z.string(),
				durationSeconds: z.number().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [attempt] = await db
				.select()
				.from(lessonAttempt)
				.where(
					and(
						eq(lessonAttempt.id, input.attemptId),
						eq(lessonAttempt.userId, userId),
					),
				)
				.limit(1);

			if (!attempt) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Attempt not found",
				});
			}

			const score = Math.round(
				(attempt.correctCount / attempt.totalCount) * 100,
			);

			await db
				.update(lessonAttempt)
				.set({
					status: "completed",
					score,
					completedAt: new Date(),
				})
				.where(eq(lessonAttempt.id, input.attemptId));

			// Insert lesson completion (idempotent via unique constraint)
			const [existing] = await db
				.select({ id: lessonCompletion.id })
				.from(lessonCompletion)
				.where(
					and(
						eq(lessonCompletion.enrollmentId, attempt.enrollmentId),
						eq(lessonCompletion.lessonId, attempt.lessonId),
					),
				)
				.limit(1);

			if (!existing) {
				await db.insert(lessonCompletion).values({
					id: crypto.randomUUID(),
					enrollmentId: attempt.enrollmentId,
					lessonId: attempt.lessonId,
					score,
				});
			}

			await recordActivity(userId, "lesson", input.durationSeconds);

			return {
				score,
				correctCount: attempt.correctCount,
				totalCount: attempt.totalCount,
			};
		}),

	getAttempt: protectedProcedure
		.input(z.object({ attemptId: z.string() }))
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [attempt] = await db
				.select()
				.from(lessonAttempt)
				.where(
					and(
						eq(lessonAttempt.id, input.attemptId),
						eq(lessonAttempt.userId, userId),
					),
				)
				.limit(1);

			if (!attempt) return null;

			return {
				...attempt,
				exercises:
					attempt.status === "completed"
						? (attempt.exercises as ExerciseItem[])
						: stripAnswers(attempt.exercises as ExerciseItem[]),
			};
		}),
});

function stripAnswers(exercises: ExerciseItem[]): ExerciseItem[] {
	return exercises.map((ex) => ({
		...ex,
		correctAnswer: ex.userAnswer !== undefined ? ex.correctAnswer : "",
		explanation: ex.userAnswer !== undefined ? ex.explanation : "",
	}));
}

function blockTypeToLessonType(blockType: string): string {
	const map: Record<string, string> = {
		teach: "grammar",
		input: "reading",
		practice: "vocabulary",
		review: "grammar",
		assessment: "grammar",
	};
	return map[blockType] ?? "grammar";
}

export type ContentRouter = typeof contentRouter;
