import { integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const word = pgTable("word", {
	id: text("id").primaryKey(),
	lemma: text("lemma").notNull().unique(),
	ipa: text("ipa"),
	audioUrl: text("audio_url"),
	partOfSpeech: text("part_of_speech"),
	definition: text("definition").notNull(),
	exampleSentence: text("example_sentence"),
	level: text("level"),
	frequencyRank: integer("frequency_rank"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const wordTranslation = pgTable(
	"word_translation",
	{
		id: text("id").primaryKey(),
		wordId: text("word_id")
			.notNull()
			.references(() => word.id, { onDelete: "cascade" }),
		language: text("language").notNull(),
		translation: text("translation").notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		unique("word_translation_word_language").on(table.wordId, table.language),
	],
);

export const phrase = pgTable("phrase", {
	id: text("id").primaryKey(),
	text: text("text").notNull().unique(),
	ipa: text("ipa"),
	audioUrl: text("audio_url"),
	level: text("level"),
	meaning: text("meaning").notNull(),
	exampleUsage: text("example_usage"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const phraseTranslation = pgTable(
	"phrase_translation",
	{
		id: text("id").primaryKey(),
		phraseId: text("phrase_id")
			.notNull()
			.references(() => phrase.id, { onDelete: "cascade" }),
		language: text("language").notNull(),
		translation: text("translation").notNull(),
		literalTranslation: text("literal_translation"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		unique("phrase_translation_phrase_language").on(
			table.phraseId,
			table.language,
		),
	],
);

export const userWord = pgTable(
	"user_word",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		wordId: text("word_id")
			.notNull()
			.references(() => word.id, { onDelete: "cascade" }),
		mastery: text("mastery").notNull().default("new"),
		source: text("source").notNull(),
		notes: text("notes"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [unique("user_word_user_word").on(table.userId, table.wordId)],
);

export const userPhrase = pgTable(
	"user_phrase",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		phraseId: text("phrase_id")
			.notNull()
			.references(() => phrase.id, { onDelete: "cascade" }),
		mastery: text("mastery").notNull().default("new"),
		source: text("source").notNull(),
		notes: text("notes"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		unique("user_phrase_user_phrase").on(table.userId, table.phraseId),
	],
);

export type Word = typeof word.$inferSelect;
export type NewWord = typeof word.$inferInsert;
export type WordTranslation = typeof wordTranslation.$inferSelect;
export type NewWordTranslation = typeof wordTranslation.$inferInsert;
export type Phrase = typeof phrase.$inferSelect;
export type NewPhrase = typeof phrase.$inferInsert;
export type PhraseTranslation = typeof phraseTranslation.$inferSelect;
export type NewPhraseTranslation = typeof phraseTranslation.$inferInsert;
export type UserWord = typeof userWord.$inferSelect;
export type NewUserWord = typeof userWord.$inferInsert;
export type UserPhrase = typeof userPhrase.$inferSelect;
export type NewUserPhrase = typeof userPhrase.$inferInsert;
