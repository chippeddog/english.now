CREATE TABLE "phrase" (
	"id" text PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"ipa" text,
	"audio_url" text,
	"level" text,
	"meaning" text NOT NULL,
	"example_usage" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "phrase_text_unique" UNIQUE("text")
);
--> statement-breakpoint
CREATE TABLE "phrase_translation" (
	"id" text PRIMARY KEY NOT NULL,
	"phrase_id" text NOT NULL,
	"language" text NOT NULL,
	"translation" text NOT NULL,
	"literal_translation" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "phrase_translation_phrase_language" UNIQUE("phrase_id","language")
);
--> statement-breakpoint
CREATE TABLE "user_phrase" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"phrase_id" text NOT NULL,
	"mastery" text DEFAULT 'new' NOT NULL,
	"source" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_phrase_user_phrase" UNIQUE("user_id","phrase_id")
);
--> statement-breakpoint
CREATE TABLE "user_word" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"word_id" text NOT NULL,
	"mastery" text DEFAULT 'new' NOT NULL,
	"source" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_word_user_word" UNIQUE("user_id","word_id")
);
--> statement-breakpoint
CREATE TABLE "word" (
	"id" text PRIMARY KEY NOT NULL,
	"lemma" text NOT NULL,
	"ipa" text,
	"audio_url" text,
	"part_of_speech" text,
	"definition" text NOT NULL,
	"example_sentence" text,
	"level" text,
	"frequency_rank" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "word_lemma_unique" UNIQUE("lemma")
);
--> statement-breakpoint
CREATE TABLE "word_translation" (
	"id" text PRIMARY KEY NOT NULL,
	"word_id" text NOT NULL,
	"language" text NOT NULL,
	"translation" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "word_translation_word_language" UNIQUE("word_id","language")
);
--> statement-breakpoint
DROP TABLE "vocabulary_phrase" CASCADE;--> statement-breakpoint
DROP TABLE "vocabulary_word" CASCADE;--> statement-breakpoint
ALTER TABLE "phrase_translation" ADD CONSTRAINT "phrase_translation_phrase_id_phrase_id_fk" FOREIGN KEY ("phrase_id") REFERENCES "public"."phrase"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_phrase" ADD CONSTRAINT "user_phrase_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_phrase" ADD CONSTRAINT "user_phrase_phrase_id_phrase_id_fk" FOREIGN KEY ("phrase_id") REFERENCES "public"."phrase"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_word" ADD CONSTRAINT "user_word_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_word" ADD CONSTRAINT "user_word_word_id_word_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."word"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_translation" ADD CONSTRAINT "word_translation_word_id_word_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."word"("id") ON DELETE cascade ON UPDATE no action;