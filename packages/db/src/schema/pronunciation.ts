import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

// ─── Types ────────────────────────────────────────────────────────────────────
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export type ParagraphItem = {
	text: string;
	topic: string;
	cefrLevel: CefrLevel;
	wordCount: number;
	focusAreas: string[];
	tips: string;
};

export type PhonemeResult = {
	phoneme: string;
	accuracyScore: number;
};

export type WordResult = {
	word: string;
	correct: boolean;
	accuracyScore: number;
	errorType:
		| "None"
		| "Omission"
		| "Insertion"
		| "Mispronunciation"
		| "UnexpectedBreak"
		| "MissingBreak"
		| "Monotone";
	phonemes: PhonemeResult[];
};

export type WeakPhoneme = {
	phoneme: string;
	score: number;
	occurrences: number;
	exampleWords: string[];
};

export type PronunciationSessionSummary = {
	averageScore: number;
	averageAccuracy: number;
	averageFluency: number;
	averageProsody: number;
	averageCompleteness: number;
	totalAttempts: number;
	bestScore: number;
	worstScore: number;
	weakWords: string[];
	weakPhonemes: WeakPhoneme[];
};

export type MistakePattern = {
	type: "phoneme" | "word_stress" | "omission" | "mispronunciation" | "fluency";
	sound: string;
	description: string;
	words: string[];
	practiceWords: string[];
	priority: "high" | "medium" | "low";
};

export type MiniExercise = {
	type:
		| "repeat_after"
		| "minimal_pairs"
		| "tongue_twister"
		| "word_chain"
		| "sentence_practice";
	title: string;
	instruction: string;
	items: string[];
	targetSkill: string;
};

export type WeakArea = {
	category:
		| "vowels"
		| "consonants"
		| "word_stress"
		| "rhythm"
		| "intonation"
		| "linking";
	severity: "high" | "medium" | "low";
	sounds: string[];
	description: string;
};

export type PracticeWordSet = {
	word: string;
	issue: string;
	relatedWords: string[];
};

export type PronunciationFeedback = {
	mistakePatterns: MistakePattern[];
	exercises: MiniExercise[];
	weakAreas: WeakArea[];
	practiceWordSets: PracticeWordSet[];
};

export const pronunciationSession = pgTable("pronunciation_session", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	mode: text("mode").notNull(),
	level: text("level"),
	paragraph: jsonb("paragraph").$type<ParagraphItem>(),
	items: jsonb("items").notNull().$type<ParagraphItem[]>(),
	status: text("status").notNull().default("active"),
	summary: jsonb("summary").$type<PronunciationSessionSummary>(),
	feedback: jsonb("feedback").$type<PronunciationFeedback>(),
	feedbackStatus: text("feedback_status")
		.$type<"pending" | "processing" | "completed" | "failed">()
		.default("pending"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	completedAt: timestamp("completed_at"),
	deletedAt: timestamp("deleted_at"),
});

export const pronunciationAttempt = pgTable("pronunciation_attempt", {
	id: text("id").primaryKey(),
	sessionId: text("session_id")
		.notNull()
		.references(() => pronunciationSession.id, { onDelete: "cascade" }),
	itemIndex: integer("item_index").notNull(),
	transcript: text("transcript").notNull(),
	score: integer("score").notNull(),
	accuracyScore: integer("accuracy_score"),
	fluencyScore: integer("fluency_score"),
	completenessScore: integer("completeness_score"),
	prosodyScore: integer("prosody_score"),
	wordResults: jsonb("word_results").notNull().$type<WordResult[]>(),
	audioUrl: text("audio_url"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PronunciationSession = typeof pronunciationSession.$inferSelect;
export type NewPronunciationSession = typeof pronunciationSession.$inferInsert;
export type PronunciationAttempt = typeof pronunciationAttempt.$inferSelect;
export type NewPronunciationAttempt = typeof pronunciationAttempt.$inferInsert;
