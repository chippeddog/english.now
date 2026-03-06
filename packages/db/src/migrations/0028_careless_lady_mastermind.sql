CREATE TABLE "daily_practice_plan" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"day_key" text NOT NULL,
	"timezone" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"activities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"home_selection" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"error" text,
	"enqueued_at" timestamp,
	"started_at" timestamp,
	"generated_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_practice_plan_user_day_key" UNIQUE("user_id","day_key")
);
--> statement-breakpoint
ALTER TABLE "daily_practice_plan" ADD CONSTRAINT "daily_practice_plan_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;