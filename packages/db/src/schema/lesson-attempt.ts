import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { lesson } from "./content";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LessonExerciseType = "multiple_choice" | "fill_in_the_blank";

export interface ExerciseItem {
	id: string;
	type: LessonExerciseType;
	prompt: string;
	options?: string[];
	correctAnswer: string;
	explanation: string;
	userAnswer?: string;
	isCorrect?: boolean;
}

// ─── Lesson Attempt ──────────────────────────────────────────────────────────

export const lessonAttempt = pgTable("lesson_attempt", {
	id: text("id").primaryKey(),
	lessonId: text("lesson_id")
		.notNull()
		.references(() => lesson.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	exercises: jsonb("exercises").$type<ExerciseItem[]>().notNull(),
	currentIndex: integer("current_index").notNull().default(0),
	score: integer("score"),
	correctCount: integer("correct_count").notNull().default(0),
	totalCount: integer("total_count").notNull(),
	status: text("status").notNull().default("active"), // active | completed
	createdAt: timestamp("created_at").notNull().defaultNow(),
	completedAt: timestamp("completed_at"),
});

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type LessonAttempt = typeof lessonAttempt.$inferSelect;
export type NewLessonAttempt = typeof lessonAttempt.$inferInsert;
