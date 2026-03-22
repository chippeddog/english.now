import { jsonb, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { user } from "./auth";
import type {
	ConversationPracticeMode,
	ConversationScenarioType,
	ConversationSessionModeConfig,
} from "./conversation";
import type { ParagraphItem } from "./pronunciation";

export type DailyPracticePlanStatus =
	| "queued"
	| "generating"
	| "ready"
	| "failed";

export type DailyVocabularyCard = {
	id: string;
	type: "word" | "phrase";
	prompt: string;
	answer: string;
	ipa: string | null;
	audioUrl: string | null;
	detail: string | null;
	level: string | null;
	currentMastery: string;
	intervalDays?: number;
	nextReviewAt?: string | null;
	isDue?: boolean;
};

type DailyPracticeActivityBase = {
	id: string;
	emoji: string;
	title: string;
	description: string;
	duration: number;
	typeLabel: string;
	startedAt: string | null;
	completedAt: string | null;
	sessionId: string | null;
};

export type DailyConversationActivity = DailyPracticeActivityBase & {
	type: "conversation";
	payload: {
		scenario: string;
		scenarioName: string;
		scenarioDescription: string;
		aiRole?: string;
		userRole?: string | null;
		goals?: string[];
		mode?: ConversationPracticeMode;
		modeConfig?: ConversationSessionModeConfig;
		scenarioType?: ConversationScenarioType;
	};
};

export type DailyPronunciationActivity = DailyPracticeActivityBase & {
	type: "pronunciation";
	payload: {
		paragraph: ParagraphItem;
	};
};

export type DailyVocabularyActivity = DailyPracticeActivityBase & {
	type: "vocabulary";
	payload: {
		cards: DailyVocabularyCard[];
		focus: Array<"words" | "phrases">;
	};
};

export type DailyPracticeActivity =
	| DailyConversationActivity
	| DailyPronunciationActivity
	| DailyVocabularyActivity;

export const dailyPracticePlan = pgTable(
	"daily_practice_plan",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		dayKey: text("day_key").notNull(),
		timezone: text("timezone").notNull(),
		status: text("status")
			.$type<DailyPracticePlanStatus>()
			.notNull()
			.default("queued"),
		activities: jsonb("activities")
			.$type<DailyPracticeActivity[]>()
			.notNull()
			.default([]),
		homeSelection: jsonb("home_selection")
			.$type<string[]>()
			.notNull()
			.default([]),
		error: text("error"),
		enqueuedAt: timestamp("enqueued_at"),
		startedAt: timestamp("started_at"),
		generatedAt: timestamp("generated_at"),
		completedAt: timestamp("completed_at"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		unique("daily_practice_plan_user_day_key").on(table.userId, table.dayKey),
	],
);

export type DailyPracticePlan = typeof dailyPracticePlan.$inferSelect;
export type NewDailyPracticePlan = typeof dailyPracticePlan.$inferInsert;
