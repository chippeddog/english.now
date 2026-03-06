import type { CurriculumLessonContent, ExerciseItem } from "@english.now/db";
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
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { generateLessonExercises } from "../services/generate-lesson-exercises";
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

		const completedLessonIds = new Set(completions.map((c) => c.lessonId));

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

		return {
			enrollmentId: e.id,
			level: c.level,
			title: c.title,
			progress: overallProgress,
			units: units.map((u) => {
				const s = statusMap.get(u.id);
				const unitLessons = lessonsByUnit.get(u.id) ?? [];
				const lessonStatusMap = new Map(
					(s?.lessons ?? []).map((ls) => [ls.lessonId, ls.status]),
				);

				return {
					id: u.id,
					title: u.title,
					description: u.description,
					order: u.order,
					status: s?.unitStatus ?? "locked",
					progress: s?.unitProgress ?? 0,
					lessons: unitLessons.map((l) => ({
						id: l.id,
						title: l.title,
						subtitle: l.subtitle,
						type: l.blockType,
						lessonType: l.lessonType ?? blockTypeToLessonType(l.blockType),
						status: lessonStatusMap.get(l.id) ?? "locked",
						progress: lessonStatusMap.get(l.id) === "completed" ? 100 : 0,
						content: l.content,
					})),
				};
			}),
		};
	}),

	getLesson: protectedProcedure
		.input(z.object({ lessonId: z.string() }))
		.query(async ({ input }) => {
			const [l] = await db
				.select()
				.from(curriculumLesson)
				.where(eq(curriculumLesson.id, input.lessonId))
				.limit(1);

			if (!l) return null;

			return {
				id: l.id,
				title: l.title,
				subtitle: l.subtitle,
				type: l.blockType,
				lessonType: l.lessonType ?? blockTypeToLessonType(l.blockType),
				content: l.content,
			};
		}),

	startLesson: protectedProcedure
		.input(z.object({ lessonId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [e] = await db
				.select({ id: enrollment.id })
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
