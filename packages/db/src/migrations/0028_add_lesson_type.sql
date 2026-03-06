-- Add lesson_type enum and column to curriculum_lesson
DO $$ BEGIN
    CREATE TYPE "public"."lesson_type" AS ENUM('grammar', 'vocabulary', 'reading', 'listening', 'speaking', 'writing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "curriculum_lesson" ADD COLUMN IF NOT EXISTS "lesson_type" "public"."lesson_type";

-- Migrate existing data: map block_type to lesson_type
UPDATE "curriculum_lesson" SET "lesson_type" = 'grammar' WHERE "block_type" = 'teach' AND "lesson_type" IS NULL;
UPDATE "curriculum_lesson" SET "lesson_type" = 'reading' WHERE "block_type" = 'input' AND "lesson_type" IS NULL;
UPDATE "curriculum_lesson" SET "lesson_type" = 'vocabulary' WHERE "block_type" = 'practice' AND "lesson_type" IS NULL;
UPDATE "curriculum_lesson" SET "lesson_type" = 'grammar' WHERE "block_type" = 'review' AND "lesson_type" IS NULL;
UPDATE "curriculum_lesson" SET "lesson_type" = 'grammar' WHERE "block_type" = 'assessment' AND "lesson_type" IS NULL;
