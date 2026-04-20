CREATE TYPE "public"."grammar_topic_relation_kind" AS ENUM('prerequisite', 'related', 'next');--> statement-breakpoint
CREATE TYPE "public"."lesson_grammar_topic_kind" AS ENUM('teach', 'practice', 'review');--> statement-breakpoint
CREATE TYPE "public"."grammar_progress_status" AS ENUM('not_started', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."grammar_mastery_level" AS ENUM('not_started', 'learning', 'confident', 'mastered');--> statement-breakpoint

CREATE TABLE "grammar_topic" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"cefr_level" "cefr_level" NOT NULL,
	"category" text NOT NULL,
	"estimated_minutes" integer,
	"content" jsonb NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "grammar_topic_relation" (
	"id" text PRIMARY KEY NOT NULL,
	"from_topic_id" text NOT NULL,
	"to_topic_id" text NOT NULL,
	"kind" "grammar_topic_relation_kind" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "lesson_grammar_topic" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL,
	"grammar_topic_id" text NOT NULL,
	"kind" "lesson_grammar_topic_kind" DEFAULT 'teach' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "user_grammar_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"grammar_topic_id" text NOT NULL,
	"status" "grammar_progress_status" DEFAULT 'not_started' NOT NULL,
	"mastery" "grammar_mastery_level" DEFAULT 'not_started' NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"confidence" real,
	"bookmark" boolean DEFAULT false NOT NULL,
	"last_practiced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "grammar_topic_relation" ADD CONSTRAINT "grammar_topic_relation_from_topic_id_grammar_topic_id_fk" FOREIGN KEY ("from_topic_id") REFERENCES "public"."grammar_topic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_topic_relation" ADD CONSTRAINT "grammar_topic_relation_to_topic_id_grammar_topic_id_fk" FOREIGN KEY ("to_topic_id") REFERENCES "public"."grammar_topic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_grammar_topic" ADD CONSTRAINT "lesson_grammar_topic_lesson_id_curriculum_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."curriculum_lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_grammar_topic" ADD CONSTRAINT "lesson_grammar_topic_grammar_topic_id_grammar_topic_id_fk" FOREIGN KEY ("grammar_topic_id") REFERENCES "public"."grammar_topic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_grammar_progress" ADD CONSTRAINT "user_grammar_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_grammar_progress" ADD CONSTRAINT "user_grammar_progress_grammar_topic_id_grammar_topic_id_fk" FOREIGN KEY ("grammar_topic_id") REFERENCES "public"."grammar_topic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE UNIQUE INDEX "grammar_topic_slug_uq" ON "grammar_topic" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "grammar_topic_level_idx" ON "grammar_topic" USING btree ("cefr_level");--> statement-breakpoint
CREATE INDEX "grammar_topic_category_idx" ON "grammar_topic" USING btree ("category");--> statement-breakpoint
CREATE INDEX "grammar_topic_published_idx" ON "grammar_topic" USING btree ("is_published");--> statement-breakpoint

CREATE UNIQUE INDEX "grammar_topic_relation_uq" ON "grammar_topic_relation" USING btree ("from_topic_id","to_topic_id","kind");--> statement-breakpoint
CREATE INDEX "grammar_topic_relation_from_idx" ON "grammar_topic_relation" USING btree ("from_topic_id","kind");--> statement-breakpoint
CREATE INDEX "grammar_topic_relation_to_idx" ON "grammar_topic_relation" USING btree ("to_topic_id","kind");--> statement-breakpoint

CREATE UNIQUE INDEX "lesson_grammar_topic_uq" ON "lesson_grammar_topic" USING btree ("lesson_id","grammar_topic_id","kind");--> statement-breakpoint
CREATE INDEX "lesson_grammar_topic_lesson_idx" ON "lesson_grammar_topic" USING btree ("lesson_id","kind");--> statement-breakpoint
CREATE INDEX "lesson_grammar_topic_topic_idx" ON "lesson_grammar_topic" USING btree ("grammar_topic_id","kind");--> statement-breakpoint

CREATE UNIQUE INDEX "user_grammar_progress_user_topic_uq" ON "user_grammar_progress" USING btree ("user_id","grammar_topic_id");--> statement-breakpoint
CREATE INDEX "user_grammar_progress_user_idx" ON "user_grammar_progress" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "user_grammar_progress_topic_idx" ON "user_grammar_progress" USING btree ("grammar_topic_id");--> statement-breakpoint
CREATE INDEX "user_grammar_progress_bookmark_idx" ON "user_grammar_progress" USING btree ("user_id","bookmark");--> statement-breakpoint
