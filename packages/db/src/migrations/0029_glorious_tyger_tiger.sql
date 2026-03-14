CREATE TYPE "public"."feature_usage_type" AS ENUM('conversation_session', 'pronunciation_session', 'lesson_start', 'vocabulary_add', 'vocabulary_review');--> statement-breakpoint
CREATE TABLE "feature_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"day_key" text NOT NULL,
	"timezone" text NOT NULL,
	"feature" "feature_usage_type" NOT NULL,
	"resource_id" text DEFAULT '' NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feature_usage" ADD CONSTRAINT "feature_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feature_usage_user_day_feature_idx" ON "feature_usage" USING btree ("user_id","day_key","feature");--> statement-breakpoint
CREATE UNIQUE INDEX "feature_usage_user_day_feature_resource_uq" ON "feature_usage" USING btree ("user_id","day_key","feature","resource_id");