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

export const grammarSessionPhase = pgEnum("grammar_session_phase", [
	"diagnose",
	"practice",
	"completed",
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
	ruleShort?: string;
	signal?: string;
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

export type GrammarItemPhase = "diagnose" | "controlled" | "semi" | "freer";

export type GrammarItemType =
	| "multiple_choice"
	| "fill_in_the_blank"
	| "reorder_words"
	| "sentence_transformation"
	| "error_identification"
	| "sentence_correction"
	| "sentence_building";

export type GrammarItemDifficulty = "easy" | "medium" | "hard";

export interface GrammarItemTranslation {
	prompt?: string;
	hint?: string;
	explanation?: string;
	instruction?: string;
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
	phase: GrammarItemPhase;
	type: GrammarItemType;
	difficulty: GrammarItemDifficulty;
	prompt: string;
	instruction?: string;
	options?: string[];
	items?: string[];
	correctAnswer: string | string[];
	answer?: string;
	hint?: string;
	ruleTitle: string;
	explanation: string;
	l1?: GrammarItemTranslation;
	isLegacy?: boolean;
}

export interface GrammarPracticeSetMetadata {
	model?: string;
	promptVersion?: string;
	nativeLanguage?: string | null;
	source?: "script" | "runtime";
}

export const grammarPracticeSet = pgTable(
	"grammar_practice_set",
	{
		id: text("id").primaryKey(),
		grammarTopicId: text("grammar_topic_id")
			.notNull()
			.references(() => grammarTopic.id, { onDelete: "cascade" }),
		version: integer("version").notNull().default(1),
		itemCount: integer("item_count").notNull().default(0),
		metadata: jsonb("metadata").$type<GrammarPracticeSetMetadata>(),
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(t) => ({
		topicIdx: index("grammar_practice_set_topic_idx").on(
			t.grammarTopicId,
			t.isActive,
		),
		versionUq: uniqueIndex("grammar_practice_set_topic_version_uq").on(
			t.grammarTopicId,
			t.version,
		),
	}),
);

export const grammarPracticeItem = pgTable(
	"grammar_practice_item",
	{
		id: text("id").primaryKey(),
		setId: text("set_id")
			.notNull()
			.references(() => grammarPracticeSet.id, { onDelete: "cascade" }),
		grammarTopicId: text("grammar_topic_id")
			.notNull()
			.references(() => grammarTopic.id, { onDelete: "cascade" }),
		phase: text("phase")
			.$type<Exclude<GrammarItemPhase, "diagnose">>()
			.notNull(),
		type: text("type").$type<GrammarItemType>().notNull(),
		difficulty: text("difficulty").$type<GrammarItemDifficulty>().notNull(),
		ruleTitle: text("rule_title").notNull(),
		item: jsonb("item").$type<GrammarSessionItem>().notNull(),
		itemHash: text("item_hash").notNull(),
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(t) => ({
		topicIdx: index("grammar_practice_item_topic_idx").on(
			t.grammarTopicId,
			t.isActive,
		),
		setIdx: index("grammar_practice_item_set_idx").on(t.setId),
		metadataIdx: index("grammar_practice_item_metadata_idx").on(
			t.grammarTopicId,
			t.phase,
			t.difficulty,
		),
		hashUq: uniqueIndex("grammar_practice_item_set_hash_uq").on(
			t.setId,
			t.itemHash,
		),
	}),
);

export interface GrammarSessionSummary {
	totalItems: number;
	correctCount: number;
	incorrectCount: number;
	scorePercent: number;
	weakRules: string[];
	hintsUsed?: number;
	mistakeBankCount?: number;
	diagnoseScorePercent?: number;
	phaseBreakdown?: Partial<Record<GrammarItemPhase, number>>;
}

export interface GrammarDiagnoseResult {
	correct: number;
	total: number;
	targetDifficultyMix: {
		controlled: number;
		semi: number;
		freer: number;
	};
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
		phase: grammarSessionPhase("phase").notNull().default("diagnose"),
		items: jsonb("items").notNull().$type<GrammarSessionItem[]>(),
		diagnoseResult: jsonb("diagnose_result").$type<GrammarDiagnoseResult>(),
		summary: jsonb("summary").$type<GrammarSessionSummary>(),
		hintsUsed: integer("hints_used").notNull().default(0),
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
		hintUsed: boolean("hint_used").notNull().default(false),
		phase: text("phase"),
		itemType: text("item_type"),
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

export const grammarMistake = pgTable(
	"grammar_mistake",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		grammarTopicId: text("grammar_topic_id")
			.notNull()
			.references(() => grammarTopic.id, { onDelete: "cascade" }),
		ruleTitle: text("rule_title").notNull(),
		fingerprint: text("fingerprint").notNull(),
		itemSnapshot: jsonb("item_snapshot").$type<GrammarSessionItem>().notNull(),
		lastUserAnswer: text("last_user_answer"),
		timesWrong: integer("times_wrong").notNull().default(1),
		timesRight: integer("times_right").notNull().default(0),
		easeFactor: real("ease_factor").notNull().default(2.5),
		intervalDays: integer("interval_days").notNull().default(0),
		repetitions: integer("repetitions").notNull().default(0),
		nextReviewAt: timestamp("next_review_at").notNull(),
		lastAttemptAt: timestamp("last_attempt_at").notNull().defaultNow(),
		retiredAt: timestamp("retired_at"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(t) => ({
		userIdx: index("grammar_mistake_user_idx").on(t.userId, t.nextReviewAt),
		topicIdx: index("grammar_mistake_topic_idx").on(t.grammarTopicId),
		fingerprintUq: uniqueIndex("grammar_mistake_fingerprint_uq").on(
			t.userId,
			t.fingerprint,
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
export type GrammarPracticeSet = typeof grammarPracticeSet.$inferSelect;
export type NewGrammarPracticeSet = typeof grammarPracticeSet.$inferInsert;
export type GrammarPracticeItem = typeof grammarPracticeItem.$inferSelect;
export type NewGrammarPracticeItem = typeof grammarPracticeItem.$inferInsert;
export type GrammarSession = typeof grammarSession.$inferSelect;
export type NewGrammarSession = typeof grammarSession.$inferInsert;
export type GrammarAttempt = typeof grammarAttempt.$inferSelect;
export type NewGrammarAttempt = typeof grammarAttempt.$inferInsert;
export type GrammarMistake = typeof grammarMistake.$inferSelect;
export type NewGrammarMistake = typeof grammarMistake.$inferInsert;
