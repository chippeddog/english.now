CREATE TYPE "public"."cefr_level" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');--> statement-breakpoint
CREATE TYPE "public"."course_version_status" AS ENUM('draft', 'in_review', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."created_by_kind" AS ENUM('human', 'agent');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('active', 'completed', 'paused');--> statement-breakpoint
CREATE TYPE "public"."lesson_block_type" AS ENUM('input', 'teach', 'practice', 'review', 'assessment');--> statement-breakpoint
CREATE TABLE "course" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"level" "cefr_level" NOT NULL,
	"target_lang" text DEFAULT 'en' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_version" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"version" integer NOT NULL,
	"status" "course_version_status" DEFAULT 'draft' NOT NULL,
	"blueprint" jsonb,
	"created_by" "created_by_kind" DEFAULT 'human' NOT NULL,
	"created_by_user_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "curriculum_lesson" (
	"id" text PRIMARY KEY NOT NULL,
	"unit_id" text NOT NULL,
	"order" integer NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"block_type" "lesson_block_type" NOT NULL,
	"content" jsonb,
	"estimated_minutes" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curriculum_unit" (
	"id" text PRIMARY KEY NOT NULL,
	"course_version_id" text NOT NULL,
	"order" integer NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"goals" jsonb,
	"tags" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollment" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_version_id" text NOT NULL,
	"status" "enrollment_status" DEFAULT 'active' NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "lesson_completion" (
	"id" text PRIMARY KEY NOT NULL,
	"enrollment_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"score" integer,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson_attempt" DROP CONSTRAINT "lesson_attempt_lesson_id_lesson_id_fk";
--> statement-breakpoint
ALTER TABLE "lesson_attempt" ADD COLUMN "enrollment_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "course_version" ADD CONSTRAINT "course_version_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_version" ADD CONSTRAINT "course_version_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_lesson" ADD CONSTRAINT "curriculum_lesson_unit_id_curriculum_unit_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."curriculum_unit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_unit" ADD CONSTRAINT "curriculum_unit_course_version_id_course_version_id_fk" FOREIGN KEY ("course_version_id") REFERENCES "public"."course_version"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_course_version_id_course_version_id_fk" FOREIGN KEY ("course_version_id") REFERENCES "public"."course_version"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_completion" ADD CONSTRAINT "lesson_completion_enrollment_id_enrollment_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_completion" ADD CONSTRAINT "lesson_completion_lesson_id_curriculum_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."curriculum_lesson"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "course_slug_uq" ON "course" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "course_level_idx" ON "course" USING btree ("level");--> statement-breakpoint
CREATE INDEX "course_active_idx" ON "course" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "course_version_course_version_uq" ON "course_version" USING btree ("course_id","version");--> statement-breakpoint
CREATE INDEX "course_version_course_status_idx" ON "course_version" USING btree ("course_id","status");--> statement-breakpoint
CREATE INDEX "curriculum_lesson_unit_order_idx" ON "curriculum_lesson" USING btree ("unit_id","order");--> statement-breakpoint
CREATE UNIQUE INDEX "curriculum_lesson_unit_slug_uq" ON "curriculum_lesson" USING btree ("unit_id","slug");--> statement-breakpoint
CREATE INDEX "curriculum_unit_version_order_idx" ON "curriculum_unit" USING btree ("course_version_id","order");--> statement-breakpoint
CREATE UNIQUE INDEX "curriculum_unit_version_slug_uq" ON "curriculum_unit" USING btree ("course_version_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "enrollment_user_course_uq" ON "enrollment" USING btree ("user_id","course_version_id");--> statement-breakpoint
CREATE INDEX "enrollment_user_status_idx" ON "enrollment" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_completion_enrollment_lesson_uq" ON "lesson_completion" USING btree ("enrollment_id","lesson_id");--> statement-breakpoint
ALTER TABLE "lesson_attempt" ADD CONSTRAINT "lesson_attempt_enrollment_id_enrollment_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_attempt" ADD CONSTRAINT "lesson_attempt_lesson_id_curriculum_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."curriculum_lesson"("id") ON DELETE no action ON UPDATE no action;