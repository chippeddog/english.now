// ─── DEPRECATED ──────────────────────────────────────────────────────────────
// These tables are replaced by the canonical curriculum schema in curriculum.ts.
// Kept temporarily for backward compatibility during migration.
// Remove after verifying all data has been migrated and no code references them.

import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const learningPath = pgTable("learning_path", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	level: text("level").notNull(),
	goal: text("goal").notNull(),
	focusAreas: jsonb("focus_areas").$type<string[]>().notNull(),
	status: text("status").notNull().default("generating"),
	progress: integer("progress").notNull().default(0),
	progressMessage: text("progress_message"),
	generatedAt: timestamp("generated_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const unit = pgTable("unit", {
	id: text("id").primaryKey(),
	learningPathId: text("learning_path_id")
		.notNull()
		.references(() => learningPath.id, { onDelete: "cascade" }),
	title: text("title").notNull(),
	description: text("description"),
	order: integer("order").notNull(),
	status: text("status").notNull().default("locked"),
	progress: integer("progress").notNull().default(0),
});

export type ExerciseType = "lecture" | "practice" | "quiz" | "conversation";

export interface GrammarPoint {
	title: string;
	description: string;
}

export interface WordToLearn {
	word: string;
	translation: string;
}

export interface LessonContent {
	description: string;
	wordCount: number;
	grammarCount: number;
	exercises: ExerciseType[];
	grammarPoints: GrammarPoint[];
	wordsToLearn: WordToLearn[];
}

export const lesson = pgTable("lesson", {
	id: text("id").primaryKey(),
	unitId: text("unit_id")
		.notNull()
		.references(() => unit.id, { onDelete: "cascade" }),
	title: text("title").notNull(),
	subtitle: text("subtitle"),
	type: text("type").notNull(),
	order: integer("order").notNull(),
	status: text("status").notNull().default("locked"),
	progress: integer("progress").notNull().default(0),
	content: jsonb("content").$type<LessonContent>(),
});

export type LearningPath = typeof learningPath.$inferSelect;
export type NewLearningPath = typeof learningPath.$inferInsert;
export type Unit = typeof unit.$inferSelect;
export type NewUnit = typeof unit.$inferInsert;
export type Lesson = typeof lesson.$inferSelect;
export type NewLesson = typeof lesson.$inferInsert;
