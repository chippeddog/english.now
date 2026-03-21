import {
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export type ConversationTopic = {
	id: string;
	name: string;
	icon: string;
	description: string;
};

export type ConversationRoleplay = {
	id: string;
	name: string;
	icon: string;
	description: string;
	aiRole: string;
};

export type ConversationScenarioType = "topic" | "roleplay";

export type ConversationPracticeMode =
	| "general-conversation"
	| "roleplay"
	| "mini-class";

export type ConversationSessionDisplay = {
	title: string;
	subtitle: string;
};

export type ConversationSessionParticipants = {
	aiRole: string;
	userRole?: string | null;
};

export type ConversationGeneralConversationModeConfig = {
	kind: "general-conversation";
	topicId: string;
	suggestedSubtopics?: string[];
};

export type ConversationRoleplayModeConfig = {
	kind: "roleplay";
	scenarioId: string;
	objective: string;
	successCriteria: string[];
	suggestedIntents: string[];
};

export type ConversationMiniClassModeConfig = {
	kind: "mini-class";
	lessonId?: string;
	objective: string;
	steps: string[];
};

export type ConversationSessionModeConfig =
	| ConversationGeneralConversationModeConfig
	| ConversationRoleplayModeConfig
	| ConversationMiniClassModeConfig;

export type ConversationSessionContext = {
	mode: ConversationPracticeMode;
	display: ConversationSessionDisplay;
	goals: string[];
	participants: ConversationSessionParticipants;
	modeConfig: ConversationSessionModeConfig;
	systemPrompt: string;
	// Legacy fields kept during rollout so older UI/API reads remain valid.
	scenarioDescription?: string;
	scenarioType?: ConversationScenarioType;
	aiRole?: string;
};

export function conversationScenarioTypeToMode(
	scenarioType?: ConversationScenarioType | null,
): ConversationPracticeMode {
	return scenarioType === "roleplay" ? "roleplay" : "general-conversation";
}

export function conversationModeToScenarioType(
	mode?: ConversationPracticeMode | null,
): ConversationScenarioType {
	return mode === "roleplay" ? "roleplay" : "topic";
}

export type ConversationReviewProblemType =
	| "grammar"
	| "vocabulary"
	| "pronunciation";

export type ConversationReviewStatus =
	| "pending"
	| "processing"
	| "completed"
	| "failed";

export type ConversationReviewSeverity = "low" | "medium" | "high";

/** UTF-16 code unit offsets into `conversation_message.content` for transcript highlighting. */
export type ConversationReviewTranscriptSpan = {
	messageId: string;
	start: number;
	end: number;
};

/** Optional practice UX variant for grammar/vocabulary cards. */
export type ConversationReviewPracticeVariant =
	| "repeat"
	| "question-transform"
	| "fill-blank"
	| "choose-option"
	| "personalize";

/** Extended pronunciation target (one weak word / sound). */
export type ConversationReviewPronunciationTarget = {
	text: string;
	score: number;
	errorType?: string;
	messageId?: string;
	/** Full learner utterance this word came from (voice assessment reference). */
	sentenceContext?: string;
	/** Human label e.g. "Sound /θ/" */
	soundLabel?: string;
	/** UTF-16 start index inside `text` for UI highlight (weak phoneme). */
	highlightIndex?: number;
	/** Inclusive UTF-16 end index; when set, weak sound may span multiple graphemes. */
	highlightEndIndex?: number;
	/** When bundled with other targets, anchor this word in the transcript. */
	transcriptSpan?: ConversationReviewTranscriptSpan;
};

/** Inline sentence fragments: plain text or wrong→right pair for review UI. */
export type ConversationReviewInlineSegment =
	| { type: "text"; text: string }
	| {
			type: "pair";
			wrong: string;
			right: string;
			/** Default: show correction then error. Use `wrong-first` when strike should lead (e.g. ~~our~~ your). */
			order?: "right-first" | "wrong-first";
	  };

export type ConversationReviewTaskType =
	| "repeat-correction"
	| "swap-word"
	| "rephrase"
	| "pronunciation-drill";

export type ConversationReviewTaskStatus =
	| "practiced"
	| "completed"
	| "skipped";

export type ConversationReviewProblem = {
	id: string;
	type: ConversationReviewProblemType;
	title: string;
	sourceText: string;
	suggestedText: string;
	explanation: string;
	severity: ConversationReviewSeverity;
	messageId?: string;
	vocabularyItems?: string[];
	pronunciationTargets?: ConversationReviewPronunciationTarget[];
	/** e.g. Grammar → "Articles"; Vocabulary → "Word choice"; Pronunciation → "Weak sounds". */
	skillSubtype?: string;
	/** Ordered fragments for inline strike + correction UI (grammar & vocabulary). */
	inlineSegments?: ConversationReviewInlineSegment[];
	/** Precise highlight range in the transcript when available. */
	transcriptSpan?: ConversationReviewTranscriptSpan;
	/** Short line shown on cards (truncated utterance). */
	contextSnippet?: string;
	practiceVariant?: ConversationReviewPracticeVariant;
	/** Vocabulary: extra rephrases (1–2). */
	alternatives?: string[];
	/** Pronunciation: short articulation hint. */
	articulationTip?: string;
};

export type ConversationReviewTask = {
	id: string;
	problemId: string;
	type: ConversationReviewProblemType;
	taskType: ConversationReviewTaskType;
	prompt: string;
	payload: {
		sourceText?: string;
		suggestedText?: string;
		practiceText?: string;
		vocabularyItems?: string[];
		phraseToSave?: string;
		pronunciationTarget?: string;
		targetScore?: number;
		hint?: string;
		/** Azure-style weak phoneme groups with words to drill (pronunciation review). */
		phonemeGroups?: Array<{
			phoneme: string;
			displayLabel?: string;
			words: Array<{
				word: string;
				score: number;
				highlightIndex: number;
				highlightEndIndex?: number;
			}>;
		}>;
	};
};

export type ConversationReview = {
	availability?: "ready" | "not_enough_messages";
	overallScore: number | null;
	scores: {
		grammar: number | null;
		vocabulary: number | null;
		pronunciation: number | null;
	};
	problems: ConversationReviewProblem[];
	tasks: ConversationReviewTask[];
	stats: {
		totalProblems: number;
		totalTasks: number;
	};
};

export const conversationSession = pgTable("conversation_session", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	scenario: text("scenario").notNull(),
	mode: text("mode")
		.$type<ConversationPracticeMode>()
		.notNull()
		.default("general-conversation"),
	level: text("level").notNull(), // beginner, intermediate, advanced
	context: jsonb("context").$type<ConversationSessionContext>(),
	status: text("status").notNull().default("active"), // active, completed, abandoned
	reviewStatus: text("review_status")
		.$type<ConversationReviewStatus>()
		.notNull()
		.default("pending"),
	reviewGeneratedAt: timestamp("review_generated_at"),
	review: jsonb("review").$type<ConversationReview>(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	deletedAt: timestamp("deleted_at"),
});

export const conversationMessage = pgTable("conversation_message", {
	id: text("id").primaryKey(),
	sessionId: text("session_id")
		.notNull()
		.references(() => conversationSession.id, { onDelete: "cascade" }),
	role: text("role").notNull(),
	content: text("content").notNull(),
	audioUrl: text("audio_url"), // URL to stored audio if voice message
	metadata: jsonb("metadata").$type<{
		transcribedFrom?: "voice" | "text";
		processingTime?: number;
	}>(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const conversationSuggestion = pgTable("conversation_suggestion", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	topics: jsonb("topics").$type<ConversationTopic[]>().notNull(),
	roleplays: jsonb("roleplays").$type<ConversationRoleplay[]>().notNull(),
	generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

export const conversationFeedback = pgTable("conversation_feedback", {
	id: text("id").primaryKey(),
	sessionId: text("session_id")
		.notNull()
		.references(() => conversationSession.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	overallScore: integer("overall_score"),
	grammarScore: integer("grammar_score"),
	vocabularyScore: integer("vocabulary_score"),
	fluencyScore: integer("fluency_score"),
	pronunciationScore: integer("pronunciation_score"),
	summary: text("summary"),
	strengths: jsonb("strengths").$type<string[]>(),
	improvements: jsonb("improvements").$type<string[]>(),
	corrections:
		jsonb("corrections").$type<
			Array<{
				original: string;
				corrected: string;
				explanation: string;
				type: "grammar" | "vocabulary" | "pronunciation" | "fluency";
			}>
		>(),
	vocabularySuggestions: jsonb("vocabulary_suggestions").$type<string[]>(),
	status: text("status").notNull().default("generating"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	completedAt: timestamp("completed_at"),
});

export const conversationReviewAttempt = pgTable(
	"conversation_review_attempt",
	{
		id: text("id").primaryKey(),
		sessionId: text("session_id")
			.notNull()
			.references(() => conversationSession.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		taskId: text("task_id").notNull(),
		problemId: text("problem_id").notNull(),
		type: text("type").$type<ConversationReviewProblemType>().notNull(),
		status: text("status").$type<ConversationReviewTaskStatus>().notNull(),
		result: jsonb("result").$type<Record<string, unknown> | null>(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		unique("conversation_review_attempt_session_user_task").on(
			table.sessionId,
			table.userId,
			table.taskId,
		),
	],
);

export type ConversationSuggestion = typeof conversationSuggestion.$inferSelect;
export type NewConversationSuggestion =
	typeof conversationSuggestion.$inferInsert;
export type ConversationSession = typeof conversationSession.$inferSelect;
export type NewConversationSession = typeof conversationSession.$inferInsert;
export type ConversationMessage = typeof conversationMessage.$inferSelect;
export type NewConversationMessage = typeof conversationMessage.$inferInsert;
export type ConversationFeedback = typeof conversationFeedback.$inferSelect;
export type NewConversationFeedback = typeof conversationFeedback.$inferInsert;
export type ConversationReviewAttempt =
	typeof conversationReviewAttempt.$inferSelect;
export type NewConversationReviewAttempt =
	typeof conversationReviewAttempt.$inferInsert;
