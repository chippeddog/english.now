CREATE TABLE IF NOT EXISTS "daily_suggestion" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"activities" jsonb NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "daily_suggestion" ADD CONSTRAINT "daily_suggestion_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
