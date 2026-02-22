import { asc, db, eq, learningPath, lesson, unit } from "@english.now/db";
import { z } from "zod";
import { protectedProcedure, router } from "../index";

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

		// Get all lessons for all units in one query
		const allLessons =
			unitIds.length > 0
				? await db
						.select()
						.from(lesson)
						.where(
							// Use OR for multiple unit IDs
							unitIds.length === 1
								? eq(lesson.unitId, unitIds[0])
								: // For multiple units, query per unit
									eq(lesson.unitId, unitIds[0]),
						)
				: [];

		// If multiple units, fetch all lessons
		const lessonsByUnit: Record<string, typeof allLessons> = {};
		if (unitIds.length > 1) {
			const allLessonResults = await Promise.all(
				unitIds.map((unitId) =>
					db
						.select()
						.from(lesson)
						.where(eq(lesson.unitId, unitId))
						.orderBy(asc(lesson.order)),
				),
			);
			for (let i = 0; i < unitIds.length; i++) {
				lessonsByUnit[unitIds[i]] = allLessonResults[i];
			}
		} else if (unitIds.length === 1) {
			lessonsByUnit[unitIds[0]] = allLessons;
		}

		return {
			...path,
			units: units.map((u) => ({
				...u,
				lessons: lessonsByUnit[u.id] ?? [],
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
					...(input.progress !== undefined ? { progress: input.progress } : {}),
				})
				.where(eq(lesson.id, input.lessonId));

			// If lesson completed, update unit progress
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
					const unitProgress = Math.round((completedCount / totalCount) * 100);

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
});

export type ContentRouter = typeof contentRouter;
