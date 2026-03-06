import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const cefrLevel = pgEnum("cefr_level", [
	"A1",
	"A2",
	"B1",
	"B2",
	"C1",
	"C2",
]);

export const courseVersionStatus = pgEnum("course_version_status", [
	"draft",
	"in_review",
	"published",
	"archived",
]);

export const createdByKind = pgEnum("created_by_kind", ["human", "agent"]);

export const lessonBlockType = pgEnum("lesson_block_type", [
	"input",
	"teach",
	"practice",
	"review",
	"assessment",
]);

export const lessonType = pgEnum("lesson_type", [
	"grammar",
	"vocabulary",
	"reading",
	"listening",
	"speaking",
	"writing",
]);

export const enrollmentStatus = pgEnum("enrollment_status", [
	"active",
	"completed",
	"paused",
]);

// ─── Lesson Type Values ──────────────────────────────────────────────────────

export type LessonTypeValue =
	| "grammar"
	| "vocabulary"
	| "reading"
	| "listening"
	| "speaking"
	| "writing";

// ─── Type-Specific Lesson Content ────────────────────────────────────────────

export interface VocabularyItem {
	word: string;
	pos?: string;
	definition?: string;
	pronunciation?: string;
	examples?: string[];
	collocations?: string[];
	synonyms?: string[];
	antonyms?: string[];
}

interface BaseLessonContent {
	description: string;
	objectives: string[];
}

export interface GrammarLessonContent extends BaseLessonContent {
	type: "grammar";
	rules: {
		title: string;
		explanation: string;
		formula?: string;
		examples: { sentence: string; highlight: string; note?: string }[];
		commonMistakes?: { wrong: string; correct: string; why: string }[];
	}[];
	vocabulary: VocabularyItem[];
}

export interface VocabularyLessonContent extends BaseLessonContent {
	type: "vocabulary";
	words: VocabularyItem[];
	thematicGroup?: string;
}

export interface ReadingLessonContent extends BaseLessonContent {
	type: "reading";
	passage: { title: string; text: string; source?: string };
	glossary: { word: string; definition: string }[];
	comprehensionFocus: string;
}

export interface ListeningLessonContent extends BaseLessonContent {
	type: "listening";
	audioScript: string;
	listeningFocus: string;
	preTasks?: string[];
}

export interface SpeakingLessonContent extends BaseLessonContent {
	type: "speaking";
	dialogueExamples: { speaker: string; text: string }[];
	usefulPhrases: { phrase: string; usage: string }[];
	pronunciationFocus?: { sound: string; examples: string[] }[];
}

export interface WritingLessonContent extends BaseLessonContent {
	type: "writing";
	writingType: string;
	modelText: string;
	structureGuide: { section: string; description: string }[];
	usefulExpressions: string[];
}

export type CurriculumLessonContent =
	| GrammarLessonContent
	| VocabularyLessonContent
	| ReadingLessonContent
	| ListeningLessonContent
	| SpeakingLessonContent
	| WritingLessonContent;

// ─── Course Blueprint ────────────────────────────────────────────────────────

export interface LessonTypeMix {
	grammar?: number;
	vocabulary?: number;
	reading?: number;
	listening?: number;
	speaking?: number;
	writing?: number;
}

export interface CourseBlueprint {
	level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
	units: number;
	lessonsPerUnit: number;
	lessonTypeMix: LessonTypeMix;
	blockMix?: {
		input?: number;
		teach?: number;
		practice?: number;
		review?: number;
		assessment?: number;
	};
	constraints?: {
		maxSentenceWords?: number;
		wordRange?: [number, number];
	};
}

export interface UnitGoals {
	functions?: string[];
	skills?: string[];
	grammar?: string[];
	pronFocus?: string[];
}

export interface UnitTags {
	topics?: string[];
	register?: "neutral" | "formal" | "informal";
}

export const course = pgTable(
	"course",
	{
		id: text("id").primaryKey(),
		slug: text("slug").notNull(),
		title: text("title").notNull(),
		description: text("description"),
		level: cefrLevel("level").notNull(),
		targetLang: text("target_lang").notNull().default("en"),
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(t) => ({
		slugUq: uniqueIndex("course_slug_uq").on(t.slug),
		levelIdx: index("course_level_idx").on(t.level),
		activeIdx: index("course_active_idx").on(t.isActive),
	}),
);

export const courseVersion = pgTable(
	"course_version",
	{
		id: text("id").primaryKey(),
		courseId: text("course_id")
			.notNull()
			.references(() => course.id, { onDelete: "cascade" }),
		version: integer("version").notNull(),
		status: courseVersionStatus("status").notNull().default("draft"),
		blueprint: jsonb("blueprint").$type<CourseBlueprint>(),
		createdBy: createdByKind("created_by").notNull().default("human"),
		createdByUserId: text("created_by_user_id").references(() => user.id, {
			onDelete: "set null",
		}),
		notes: text("notes"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		publishedAt: timestamp("published_at"),
	},
	(t) => ({
		courseVersionUq: uniqueIndex("course_version_course_version_uq").on(
			t.courseId,
			t.version,
		),
		courseStatusIdx: index("course_version_course_status_idx").on(
			t.courseId,
			t.status,
		),
	}),
);

export const curriculumUnit = pgTable(
	"curriculum_unit",
	{
		id: text("id").primaryKey(),
		courseVersionId: text("course_version_id")
			.notNull()
			.references(() => courseVersion.id, { onDelete: "cascade" }),
		order: integer("order").notNull(),
		slug: text("slug").notNull(),
		title: text("title").notNull(),
		description: text("description"),
		goals: jsonb("goals").$type<UnitGoals>(),
		tags: jsonb("tags").$type<UnitTags>(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(t) => ({
		versionOrderIdx: index("curriculum_unit_version_order_idx").on(
			t.courseVersionId,
			t.order,
		),
		versionSlugUq: uniqueIndex("curriculum_unit_version_slug_uq").on(
			t.courseVersionId,
			t.slug,
		),
	}),
);

export const curriculumLesson = pgTable(
	"curriculum_lesson",
	{
		id: text("id").primaryKey(),
		unitId: text("unit_id")
			.notNull()
			.references(() => curriculumUnit.id, { onDelete: "cascade" }),
		order: integer("order").notNull(),
		slug: text("slug").notNull(),
		title: text("title").notNull(),
		subtitle: text("subtitle"),
		blockType: lessonBlockType("block_type").notNull(),
		lessonType: lessonType("lesson_type"),
		content: jsonb("content").$type<CurriculumLessonContent>(),
		estimatedMinutes: integer("estimated_minutes"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(t) => ({
		unitOrderIdx: index("curriculum_lesson_unit_order_idx").on(
			t.unitId,
			t.order,
		),
		unitSlugUq: uniqueIndex("curriculum_lesson_unit_slug_uq").on(
			t.unitId,
			t.slug,
		),
	}),
);

export const enrollment = pgTable(
	"enrollment",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		courseVersionId: text("course_version_id")
			.notNull()
			.references(() => courseVersion.id),
		status: enrollmentStatus("status").notNull().default("active"),
		enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
		completedAt: timestamp("completed_at"),
	},
	(t) => ({
		userCourseUq: uniqueIndex("enrollment_user_course_uq").on(
			t.userId,
			t.courseVersionId,
		),
		userStatusIdx: index("enrollment_user_status_idx").on(t.userId, t.status),
	}),
);

export const lessonCompletion = pgTable(
	"lesson_completion",
	{
		id: text("id").primaryKey(),
		enrollmentId: text("enrollment_id")
			.notNull()
			.references(() => enrollment.id, { onDelete: "cascade" }),
		lessonId: text("lesson_id")
			.notNull()
			.references(() => curriculumLesson.id),
		score: integer("score"),
		completedAt: timestamp("completed_at").notNull().defaultNow(),
	},
	(t) => ({
		enrollmentLessonUq: uniqueIndex(
			"lesson_completion_enrollment_lesson_uq",
		).on(t.enrollmentId, t.lessonId),
	}),
);

export type Course = typeof course.$inferSelect;
export type NewCourse = typeof course.$inferInsert;
export type CourseVersion = typeof courseVersion.$inferSelect;
export type NewCourseVersion = typeof courseVersion.$inferInsert;
export type CurriculumUnit = typeof curriculumUnit.$inferSelect;
export type NewCurriculumUnit = typeof curriculumUnit.$inferInsert;
export type CurriculumLesson = typeof curriculumLesson.$inferSelect;
export type NewCurriculumLesson = typeof curriculumLesson.$inferInsert;
export type Enrollment = typeof enrollment.$inferSelect;
export type NewEnrollment = typeof enrollment.$inferInsert;
export type LessonCompletion = typeof lessonCompletion.$inferSelect;
export type NewLessonCompletion = typeof lessonCompletion.$inferInsert;
