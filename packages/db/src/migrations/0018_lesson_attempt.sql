CREATE TABLE "lesson_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL,
	"user_id" text NOT NULL,
	"exercises" jsonb NOT NULL,
	"current_index" integer DEFAULT 0 NOT NULL,
	"score" integer,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"total_count" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "lesson_attempt" ADD CONSTRAINT "lesson_attempt_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_attempt" ADD CONSTRAINT "lesson_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;