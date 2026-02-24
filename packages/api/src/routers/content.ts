import {
	and,
	asc,
	db,
	eq,
	learningPath,
	lesson,
	lessonAttempt,
	unit,
	userProfile,
} from "@english.now/db";
import type { ExerciseItem, LessonContent } from "@english.now/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { generateLessonExercises } from "../services/generate-lesson-exercises";
import { recordActivity } from "../services/record-activity";

export const contentRouter = router({
	getGenerationStatus: protectedProcedure.query(async ({ ctx }) => {
		const [path] = await db
			.select({
				id: learningPath.id,
				status: learningPath.status,
				progress: learningPath.progress,
				progressMessage: learningPath.progressMessage,
			})
			.from(learningPath)
			.where(eq(learningPath.userId, ctx.session.user.id))
			.limit(1);

		return path ?? null;
	}),

	getLearningPath: protectedProcedure.query(async ({ ctx }) => {
		const [path] = await db
			.select()
			.from(learningPath)
			.where(eq(learningPath.userId, ctx.session.user.id))
			.limit(1);

		if (!path) return null;

		const units = await db
			.select()
			.from(unit)
			.where(eq(unit.learningPathId, path.id))
			.orderBy(asc(unit.order));

		const unitIds = units.map((u) => u.id);

		const allLessonResults =
			unitIds.length > 0
				? await Promise.all(
						unitIds.map((unitId) =>
							db
								.select()
								.from(lesson)
								.where(eq(lesson.unitId, unitId))
								.orderBy(asc(lesson.order)),
						),
					)
				: [];

		const lessonsByUnit = new Map<
			string,
			(typeof allLessonResults)[number]
		>();
		for (let i = 0; i < unitIds.length; i++) {
			const uid = unitIds[i];
			if (uid) {
				lessonsByUnit.set(uid, allLessonResults[i] ?? []);
			}
		}

		return {
			...path,
			units: units.map((u) => ({
				...u,
				lessons: lessonsByUnit.get(u.id) ?? [],
			})),
		};
	}),

	getLesson: protectedProcedure
		.input(z.object({ lessonId: z.string() }))
		.query(async ({ input }) => {
			const [l] = await db
				.select()
				.from(lesson)
				.where(eq(lesson.id, input.lessonId))
				.limit(1);
			return l ?? null;
		}),

	updateLessonStatus: protectedProcedure
		.input(
			z.object({
				lessonId: z.string(),
				status: z.enum(["locked", "available", "current", "completed"]),
				progress: z.number().min(0).max(100).optional(),
			}),
		)
		.mutation(async ({ input }) => {
			await db
				.update(lesson)
				.set({
					status: input.status,
					...(input.progress !== undefined
						? { progress: input.progress }
						: {}),
				})
				.where(eq(lesson.id, input.lessonId));

			if (input.status === "completed") {
				const [updatedLesson] = await db
					.select({ unitId: lesson.unitId })
					.from(lesson)
					.where(eq(lesson.id, input.lessonId))
					.limit(1);

				if (updatedLesson) {
					const unitLessons = await db
						.select({ status: lesson.status })
						.from(lesson)
						.where(eq(lesson.unitId, updatedLesson.unitId));

					const completedCount = unitLessons.filter(
						(l) => l.status === "completed",
					).length;
					const totalCount = unitLessons.length;
					const unitProgress = Math.round(
						(completedCount / totalCount) * 100,
					);

					await db
						.update(unit)
						.set({
							progress: unitProgress,
							status: unitProgress === 100 ? "completed" : "active",
						})
						.where(eq(unit.id, updatedLesson.unitId));
				}
			}

			return { success: true };
		}),

	// ─── Lesson Exercise Endpoints ───────────────────────────────────────────

	startLesson: protectedProcedure
		.input(z.object({ lessonId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

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
					exercises: stripAnswers(
						existingAttempt.exercises as ExerciseItem[],
					),
					currentIndex: existingAttempt.currentIndex,
					totalCount: existingAttempt.totalCount,
					correctCount: existingAttempt.correctCount,
				};
			}

			const [lessonRecord] = await db
				.select()
				.from(lesson)
				.where(eq(lesson.id, input.lessonId))
				.limit(1);

			if (!lessonRecord) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Lesson not found",
				});
			}

			if (lessonRecord.status === "locked") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Lesson is locked",
				});
			}

			const content = lessonRecord.content as LessonContent | null;
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

			const exercises = await generateLessonExercises(
				lessonRecord.title,
				lessonRecord.type,
				content,
				profile?.nativeLanguage ?? "uk",
			);

			const attemptId = crypto.randomUUID();
			await db.insert(lessonAttempt).values({
				id: attemptId,
				lessonId: input.lessonId,
				userId,
				exercises,
				currentIndex: 0,
				totalCount: exercises.length,
				correctCount: 0,
				status: "active",
			});

			if (
				lessonRecord.status !== "current" &&
				lessonRecord.status !== "completed"
			) {
				await db
					.update(lesson)
					.set({ status: "current" })
					.where(eq(lesson.id, input.lessonId));
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
				return {
					isCorrect: exercise.isCorrect ?? false,
					correctAnswer: exercise.correctAnswer,
					explanation: exercise.explanation,
				};
			}

			const isCorrect =
				input.answer.trim().toLowerCase() ===
				exercise.correctAnswer.trim().toLowerCase();

			exercise.userAnswer = input.answer;
			exercise.isCorrect = isCorrect;

			const newCorrectCount = isCorrect
				? attempt.correctCount + 1
				: attempt.correctCount;
			const newIndex = Math.min(
				attempt.currentIndex + 1,
				attempt.totalCount,
			);

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
				correctAnswer: exercise.correctAnswer,
				explanation: exercise.explanation,
			};
		}),

	completeLesson: protectedProcedure
		.input(z.object({ attemptId: z.string() }))
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

			await db
				.update(lesson)
				.set({ status: "completed", progress: 100 })
				.where(eq(lesson.id, attempt.lessonId));

			// Advance next lesson and update unit progress
			const [completedLesson] = await db
				.select({
					unitId: lesson.unitId,
					order: lesson.order,
				})
				.from(lesson)
				.where(eq(lesson.id, attempt.lessonId))
				.limit(1);

			if (completedLesson) {
				const unitLessons = await db
					.select({
						id: lesson.id,
						status: lesson.status,
						order: lesson.order,
					})
					.from(lesson)
					.where(eq(lesson.unitId, completedLesson.unitId))
					.orderBy(asc(lesson.order));

				const completedCount = unitLessons.filter(
					(l) =>
						l.status === "completed" ||
						l.id === attempt.lessonId,
				).length;
				const unitProgress = Math.round(
					(completedCount / unitLessons.length) * 100,
				);

				await db
					.update(unit)
					.set({
						progress: unitProgress,
						status: unitProgress === 100 ? "completed" : "active",
					})
					.where(eq(unit.id, completedLesson.unitId));

				// Advance next lesson to "current"
				const nextLesson = unitLessons.find(
					(l) =>
						l.order > completedLesson.order &&
						l.status !== "completed",
				);
				if (nextLesson) {
					await db
						.update(lesson)
						.set({ status: "current" })
						.where(eq(lesson.id, nextLesson.id));
				}

				// If unit completed, unlock next unit
				if (unitProgress === 100) {
					const [currentUnit] = await db
						.select({
							learningPathId: unit.learningPathId,
							order: unit.order,
						})
						.from(unit)
						.where(eq(unit.id, completedLesson.unitId))
						.limit(1);

					if (currentUnit) {
						const allUnits = await db
							.select()
							.from(unit)
							.where(
								eq(
									unit.learningPathId,
									currentUnit.learningPathId,
								),
							)
							.orderBy(asc(unit.order));

						const nextUnit = allUnits.find(
							(u) =>
								u.order > currentUnit.order &&
								u.status === "locked",
						);

						if (nextUnit) {
							await db
								.update(unit)
								.set({ status: "active" })
								.where(eq(unit.id, nextUnit.id));

							// Unlock first lesson of next unit
							const nextUnitLessons = await db
								.select()
								.from(lesson)
								.where(eq(lesson.unitId, nextUnit.id))
								.orderBy(asc(lesson.order));

							const firstLesson = nextUnitLessons[0];
							if (firstLesson) {
								await db
									.update(lesson)
									.set({ status: "current" })
									.where(eq(lesson.id, firstLesson.id));

								for (
									let i = 1;
									i < nextUnitLessons.length;
									i++
								) {
									const nextL = nextUnitLessons[i];
									if (nextL) {
										await db
											.update(lesson)
											.set({ status: "available" })
											.where(eq(lesson.id, nextL.id));
									}
								}
							}
						}
					}
				}
			}

			await recordActivity(userId, "lesson");

			return { score, correctCount: attempt.correctCount, totalCount: attempt.totalCount };
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

export type ContentRouter = typeof contentRouter;
