CREATE TYPE "public"."grammar_session_status" AS ENUM('active', 'completed', 'abandoned');--> statement-breakpoint
CREATE TABLE "grammar_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"item_index" integer NOT NULL,
	"item_id" text NOT NULL,
	"prompt" text NOT NULL,
	"expected_answer" text NOT NULL,
	"user_answer" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"rule_title" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grammar_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"grammar_topic_id" text NOT NULL,
	"level" "cefr_level",
	"status" "grammar_session_status" DEFAULT 'active' NOT NULL,
	"items" jsonb NOT NULL,
	"summary" jsonb,
	"duration_seconds" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "grammar_attempt" ADD CONSTRAINT "grammar_attempt_session_id_grammar_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."grammar_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_session" ADD CONSTRAINT "grammar_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_session" ADD CONSTRAINT "grammar_session_grammar_topic_id_grammar_topic_id_fk" FOREIGN KEY ("grammar_topic_id") REFERENCES "public"."grammar_topic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "grammar_attempt_session_idx" ON "grammar_attempt" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "grammar_attempt_session_item_uq" ON "grammar_attempt" USING btree ("session_id","item_index");--> statement-breakpoint
CREATE INDEX "grammar_session_user_idx" ON "grammar_session" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "grammar_session_topic_idx" ON "grammar_session" USING btree ("grammar_topic_id");--> statement-breakpoint
CREATE INDEX "grammar_session_user_topic_idx" ON "grammar_session" USING btree ("user_id","grammar_topic_id");