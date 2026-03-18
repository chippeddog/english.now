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
	pronunciationTargets?: Array<{
		text: string;
		score: number;
		errorType?: string;
	}>;
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
	level: text("level").notNull(), // beginner, intermediate, advanced
	context: jsonb("context").$type<{
		systemPrompt: string;
		scenarioDescription: string;
		goals: string[];
		scenarioType?: "topic" | "roleplay";
		aiRole?: string;
	}>(),
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
	role: text("role").notNull(), // user, assistant
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
