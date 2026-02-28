-- Drop old per-user vocabulary tables
DROP TABLE IF EXISTS "vocabulary_word" CASCADE;
DROP TABLE IF EXISTS "vocabulary_phrase" CASCADE;

-- Catalog: shared word entries
CREATE TABLE "word" (
	"id" text PRIMARY KEY NOT NULL,
	"lemma" text NOT NULL UNIQUE,
	"ipa" text,
	"audio_url" text,
	"part_of_speech" text,
	"definition" text NOT NULL,
	"example_sentence" text,
	"level" text,
	"frequency_rank" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Catalog: word translations per language
CREATE TABLE "word_translation" (
	"id" text PRIMARY KEY NOT NULL,
	"word_id" text NOT NULL REFERENCES "word"("id") ON DELETE CASCADE,
	"language" text NOT NULL,
	"translation" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "word_translation_word_language" UNIQUE("word_id", "language")
);

-- Catalog: shared phrase entries
CREATE TABLE "phrase" (
	"id" text PRIMARY KEY NOT NULL,
	"text" text NOT NULL UNIQUE,
	"ipa" text,
	"audio_url" text,
	"level" text,
	"meaning" text NOT NULL,
	"example_usage" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Catalog: phrase translations per language
CREATE TABLE "phrase_translation" (
	"id" text PRIMARY KEY NOT NULL,
	"phrase_id" text NOT NULL REFERENCES "phrase"("id") ON DELETE CASCADE,
	"language" text NOT NULL,
	"translation" text NOT NULL,
	"literal_translation" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "phrase_translation_phrase_language" UNIQUE("phrase_id", "language")
);

-- Per-user word learning state
CREATE TABLE "user_word" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"word_id" text NOT NULL REFERENCES "word"("id") ON DELETE CASCADE,
	"mastery" text DEFAULT 'new' NOT NULL,
	"source" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_word_user_word" UNIQUE("user_id", "word_id")
);

-- Per-user phrase learning state
CREATE TABLE "user_phrase" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"phrase_id" text NOT NULL REFERENCES "phrase"("id") ON DELETE CASCADE,
	"mastery" text DEFAULT 'new' NOT NULL,
	"source" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_phrase_user_phrase" UNIQUE("user_id", "phrase_id")
);
