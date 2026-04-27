CREATE TYPE "public"."grammar_session_phase" AS ENUM('diagnose', 'practice', 'completed');--> statement-breakpoint
CREATE TABLE "grammar_mistake" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"grammar_topic_id" text NOT NULL,
	"rule_title" text NOT NULL,
	"fingerprint" text NOT NULL,
	"item_snapshot" jsonb NOT NULL,
	"last_user_answer" text,
	"times_wrong" integer DEFAULT 1 NOT NULL,
	"times_right" integer DEFAULT 0 NOT NULL,
	"ease_factor" real DEFAULT 2.5 NOT NULL,
	"interval_days" integer DEFAULT 0 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"next_review_at" timestamp NOT NULL,
	"last_attempt_at" timestamp DEFAULT now() NOT NULL,
	"retired_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "grammar_attempt" ADD COLUMN "hint_used" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "grammar_attempt" ADD COLUMN "phase" text;--> statement-breakpoint
ALTER TABLE "grammar_attempt" ADD COLUMN "item_type" text;--> statement-breakpoint
ALTER TABLE "grammar_session" ADD COLUMN "phase" "grammar_session_phase" DEFAULT 'diagnose' NOT NULL;--> statement-breakpoint
ALTER TABLE "grammar_session" ADD COLUMN "diagnose_result" jsonb;--> statement-breakpoint
ALTER TABLE "grammar_session" ADD COLUMN "hints_used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "grammar_mistake" ADD CONSTRAINT "grammar_mistake_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_mistake" ADD CONSTRAINT "grammar_mistake_grammar_topic_id_grammar_topic_id_fk" FOREIGN KEY ("grammar_topic_id") REFERENCES "public"."grammar_topic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "grammar_mistake_user_idx" ON "grammar_mistake" USING btree ("user_id","next_review_at");--> statement-breakpoint
CREATE INDEX "grammar_mistake_topic_idx" ON "grammar_mistake" USING btree ("grammar_topic_id");--> statement-breakpoint
CREATE UNIQUE INDEX "grammar_mistake_fingerprint_uq" ON "grammar_mistake" USING btree ("user_id","fingerprint");