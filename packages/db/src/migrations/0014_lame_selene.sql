ALTER TABLE "user_profile" ALTER COLUMN "voice_model" SET DEFAULT 'aura-2-asteria-en';--> statement-breakpoint
ALTER TABLE "pronunciation_session" ADD COLUMN "cefr_level" text;--> statement-breakpoint
ALTER TABLE "pronunciation_session" ADD COLUMN "paragraph" jsonb;--> statement-breakpoint
ALTER TABLE "pronunciation_session" ADD COLUMN "feedback" jsonb;--> statement-breakpoint
ALTER TABLE "pronunciation_session" ADD COLUMN "feedback_status" text DEFAULT 'pending';