import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { curriculumLesson, enrollment } from "./curriculum";

export type LessonExerciseType =
	// Universal
	| "multiple_choice"
	| "fill_in_the_blank"
	// Grammar
	| "sentence_correction"
	| "sentence_transformation"
	| "reorder_words"
	| "error_identification"
	// Vocabulary
	| "word_matching"
	| "synonym_antonym"
	| "categorization"
	// Reading / Listening
	| "true_false"
	| "comprehension"
	// Listening
	| "dictation"
	// Speaking
	| "dialogue_completion"
	// Writing
	| "sentence_building"
	| "error_correction";

export type ExercisePhase = "guided" | "free";
export type ExerciseDifficulty = "easy" | "medium" | "hard";

export interface ExerciseItem {
	id: string;
	type: LessonExerciseType;
	phase: ExercisePhase;
	prompt: string;
	instruction?: string;
	options?: string[];
	pairs?: { left: string; right: string }[];
	items?: string[];
	categories?: { name: string; items: string[] }[];
	correctAnswer: string | string[];
	explanation: string;
	hint?: string;
	difficulty: ExerciseDifficulty;
	userAnswer?: string | string[];
	isCorrect?: boolean;
}

export const lessonAttempt = pgTable("lesson_attempt", {
	id: text("id").primaryKey(),
	enrollmentId: text("enrollment_id")
		.notNull()
		.references(() => enrollment.id, { onDelete: "cascade" }),
	lessonId: text("lesson_id")
		.notNull()
		.references(() => curriculumLesson.id),
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

export type LessonAttempt = typeof lessonAttempt.$inferSelect;
export type NewLessonAttempt = typeof lessonAttempt.$inferInsert;
