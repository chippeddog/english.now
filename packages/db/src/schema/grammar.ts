import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	real,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { cefrLevel, curriculumLesson } from "./curriculum";

export const grammarSessionStatus = pgEnum("grammar_session_status", [
	"active",
	"completed",
	"abandoned",
]);

export const grammarTopicRelationKind = pgEnum("grammar_topic_relation_kind", [
	"prerequisite",
	"related",
	"next",
]);

export const lessonGrammarTopicKind = pgEnum("lesson_grammar_topic_kind", [
	"teach",
	"practice",
	"review",
]);

export const grammarProgressStatus = pgEnum("grammar_progress_status", [
	"not_started",
	"in_progress",
	"completed",
]);

export const grammarMasteryLevel = pgEnum("grammar_mastery_level", [
	"not_started",
	"learning",
	"confident",
	"mastered",
]);

export interface GrammarTopicExample {
	sentence: string;
	highlight: string;
	note?: string;
}

export interface GrammarTopicMistake {
	wrong: string;
	correct: string;
	why: string;
}

export interface GrammarTopicRule {
	title: string;
	explanation: string;
	formula?: string;
	examples: GrammarTopicExample[];
	commonMistakes?: GrammarTopicMistake[];
}

export interface GrammarTopicVocabularyItem {
	word: string;
	pos?: string;
	definition?: string;
	pronunciation?: string;
	examples?: string[];
}

export interface GrammarTopicPracticeConfig {
	recommendedExerciseTypes?: string[];
	promptTemplates?: string[];
	difficulty?: "easy" | "medium" | "hard";
}

export interface GrammarTopicContent {
	description: string;
	objectives: string[];
	rules: GrammarTopicRule[];
	vocabulary: GrammarTopicVocabularyItem[];
	notes?: string[];
	practice?: GrammarTopicPracticeConfig;
}

export const grammarTopic = pgTable(
	"grammar_topic",
	{
		id: text("id").primaryKey(),
		slug: text("slug").notNull(),
		title: text("title").notNull(),
		summary: text("summary").notNull(),
		cefrLevel: cefrLevel("cefr_level").notNull(),
		category: text("category").notNull(),
		estimatedMinutes: integer("estimated_minutes"),
		content: jsonb("content").$type<GrammarTopicContent>().notNull(),
		isPublished: boolean("is_published").notNull().default(true),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(t) => ({
		slugUq: uniqueIndex("grammar_topic_slug_uq").on(t.slug),
		levelIdx: index("grammar_topic_level_idx").on(t.cefrLevel),
		categoryIdx: index("grammar_topic_category_idx").on(t.category),
		publishedIdx: index("grammar_topic_published_idx").on(t.isPublished),
	}),
);

export const grammarTopicRelation = pgTable(
	"grammar_topic_relation",
	{
		id: text("id").primaryKey(),
		fromTopicId: text("from_topic_id")
			.notNull()
			.references(() => grammarTopic.id, { onDelete: "cascade" }),
		toTopicId: text("to_topic_id")
			.notNull()
			.references(() => grammarTopic.id, { onDelete: "cascade" }),
		kind: grammarTopicRelationKind("kind").notNull(),
		sortOrder: integer("sort_order").notNull().default(0),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(t) => ({
		relationUq: uniqueIndex("grammar_topic_relation_uq").on(
			t.fromTopicId,
			t.toTopicId,
			t.kind,
		),
		fromIdx: index("grammar_topic_relation_from_idx").on(t.fromTopicId, t.kind),
		toIdx: index("grammar_topic_relation_to_idx").on(t.toTopicId, t.kind),
	}),
);

export const lessonGrammarTopic = pgTable(
	"lesson_grammar_topic",
	{
		id: text("id").primaryKey(),
		lessonId: text("lesson_id")
			.notNull()
			.references(() => curriculumLesson.id, { onDelete: "cascade" }),
		grammarTopicId: text("grammar_topic_id")
			.notNull()
			.references(() => grammarTopic.id, { onDelete: "cascade" }),
		kind: lessonGrammarTopicKind("kind").notNull().default("teach"),
		sortOrder: integer("sort_order").notNull().default(0),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(t) => ({
		lessonTopicUq: uniqueIndex("lesson_grammar_topic_uq").on(
			t.lessonId,
			t.grammarTopicId,
			t.kind,
		),
		lessonIdx: index("lesson_grammar_topic_lesson_idx").on(t.lessonId, t.kind),
		topicIdx: index("lesson_grammar_topic_topic_idx").on(
			t.grammarTopicId,
			t.kind,
		),
	}),
);

export const userGrammarProgress = pgTable(
	"user_grammar_progress",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		grammarTopicId: text("grammar_topic_id")
			.notNull()
			.references(() => grammarTopic.id, { onDelete: "cascade" }),
		status: grammarProgressStatus("status").notNull().default("not_started"),
		mastery: grammarMasteryLevel("mastery").notNull().default("not_started"),
		progressPercent: integer("progress_percent").notNull().default(0),
		confidence: real("confidence"),
		bookmark: boolean("bookmark").notNull().default(false),
		lastPracticedAt: timestamp("last_practiced_at"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(t) => ({
		userTopicUq: uniqueIndex("user_grammar_progress_user_topic_uq").on(
			t.userId,
			t.grammarTopicId,
		),
		userIdx: index("user_grammar_progress_user_idx").on(t.userId, t.status),
		topicIdx: index("user_grammar_progress_topic_idx").on(t.grammarTopicId),
		bookmarkIdx: index("user_grammar_progress_bookmark_idx").on(
			t.userId,
			t.bookmark,
		),
	}),
);

export interface GrammarSessionItem {
	id: string;
	prompt: string;
	answer: string;
	ruleTitle: string;
	explanation?: string;
}

export interface GrammarSessionSummary {
	totalItems: number;
	correctCount: number;
	incorrectCount: number;
	scorePercent: number;
	weakRules: string[];
}

export const grammarSession = pgTable(
	"grammar_session",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		grammarTopicId: text("grammar_topic_id")
			.notNull()
			.references(() => grammarTopic.id, { onDelete: "cascade" }),
		level: cefrLevel("level"),
		status: grammarSessionStatus("status").notNull().default("active"),
		items: jsonb("items").notNull().$type<GrammarSessionItem[]>(),
		summary: jsonb("summary").$type<GrammarSessionSummary>(),
		durationSeconds: integer("duration_seconds"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		completedAt: timestamp("completed_at"),
		deletedAt: timestamp("deleted_at"),
	},
	(t) => ({
		userIdx: index("grammar_session_user_idx").on(t.userId, t.status),
		topicIdx: index("grammar_session_topic_idx").on(t.grammarTopicId),
		userTopicIdx: index("grammar_session_user_topic_idx").on(
			t.userId,
			t.grammarTopicId,
		),
	}),
);

export const grammarAttempt = pgTable(
	"grammar_attempt",
	{
		id: text("id").primaryKey(),
		sessionId: text("session_id")
			.notNull()
			.references(() => grammarSession.id, { onDelete: "cascade" }),
		itemIndex: integer("item_index").notNull(),
		itemId: text("item_id").notNull(),
		prompt: text("prompt").notNull(),
		expectedAnswer: text("expected_answer").notNull(),
		userAnswer: text("user_answer").notNull(),
		isCorrect: boolean("is_correct").notNull(),
		ruleTitle: text("rule_title"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(t) => ({
		sessionIdx: index("grammar_attempt_session_idx").on(t.sessionId),
		sessionItemUq: uniqueIndex("grammar_attempt_session_item_uq").on(
			t.sessionId,
			t.itemIndex,
		),
	}),
);

export type GrammarTopic = typeof grammarTopic.$inferSelect;
export type NewGrammarTopic = typeof grammarTopic.$inferInsert;
export type GrammarTopicRelation = typeof grammarTopicRelation.$inferSelect;
export type NewGrammarTopicRelation = typeof grammarTopicRelation.$inferInsert;
export type LessonGrammarTopic = typeof lessonGrammarTopic.$inferSelect;
export type NewLessonGrammarTopic = typeof lessonGrammarTopic.$inferInsert;
export type UserGrammarProgress = typeof userGrammarProgress.$inferSelect;
export type NewUserGrammarProgress = typeof userGrammarProgress.$inferInsert;
export type GrammarSession = typeof grammarSession.$inferSelect;
export type NewGrammarSession = typeof grammarSession.$inferInsert;
export type GrammarAttempt = typeof grammarAttempt.$inferSelect;
export type NewGrammarAttempt = typeof grammarAttempt.$inferInsert;
