ALTER TABLE "pronunciation_session" RENAME COLUMN "difficulty" TO "level";--> statement-breakpoint
ALTER TABLE "pronunciation_session" DROP COLUMN "cefr_level";