CREATE TABLE "conversation_review_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"task_id" text NOT NULL,
	"problem_id" text NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"result" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_review_attempt_session_user_task" UNIQUE("session_id","user_id","task_id")
);
--> statement-breakpoint
ALTER TABLE "conversation_session" ADD COLUMN "review_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "conversation_session" ADD COLUMN "review_generated_at" timestamp;--> statement-breakpoint
ALTER TABLE "conversation_session" ADD COLUMN "review" jsonb;--> statement-breakpoint
ALTER TABLE "conversation_review_attempt" ADD CONSTRAINT "conversation_review_attempt_session_id_conversation_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."conversation_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_review_attempt" ADD CONSTRAINT "conversation_review_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;