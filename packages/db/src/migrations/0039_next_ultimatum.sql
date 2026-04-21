ALTER TABLE "user_phrase" ADD COLUMN "custom_meaning" text;--> statement-breakpoint
ALTER TABLE "user_phrase" ADD COLUMN "custom_example_usage" text;--> statement-breakpoint
ALTER TABLE "user_phrase" ADD COLUMN "custom_translation" text;--> statement-breakpoint
ALTER TABLE "user_phrase" ADD COLUMN "custom_literal_translation" text;--> statement-breakpoint
ALTER TABLE "user_word" ADD COLUMN "custom_part_of_speech" text;--> statement-breakpoint
ALTER TABLE "user_word" ADD COLUMN "custom_definition" text;--> statement-breakpoint
ALTER TABLE "user_word" ADD COLUMN "custom_example_sentence" text;--> statement-breakpoint
ALTER TABLE "user_word" ADD COLUMN "custom_translation" text;