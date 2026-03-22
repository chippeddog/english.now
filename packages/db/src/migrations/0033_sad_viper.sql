ALTER TABLE "user_phrase" ADD COLUMN "repetition" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_phrase" ADD COLUMN "interval_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_phrase" ADD COLUMN "ease_factor" real DEFAULT 2.5 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_phrase" ADD COLUMN "lapses" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_phrase" ADD COLUMN "last_reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_phrase" ADD COLUMN "next_review_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_word" ADD COLUMN "repetition" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_word" ADD COLUMN "interval_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_word" ADD COLUMN "ease_factor" real DEFAULT 2.5 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_word" ADD COLUMN "lapses" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_word" ADD COLUMN "last_reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_word" ADD COLUMN "next_review_at" timestamp DEFAULT now() NOT NULL;