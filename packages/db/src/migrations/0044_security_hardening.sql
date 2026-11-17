ALTER TABLE "user_profile" ADD COLUMN "timezone_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "paddle_event_occurred_at" timestamp;--> statement-breakpoint
-- Keep one profile per user (prefer onboarded, then most recently updated) before adding the unique constraint.
DELETE FROM "user_profile" AS p
USING (
	SELECT "id", row_number() OVER (
		PARTITION BY "user_id"
		ORDER BY "is_onboarding_completed" DESC, "updated_at" DESC, "created_at" DESC
	) AS rn
	FROM "user_profile"
) AS ranked
WHERE p."id" = ranked."id" AND ranked.rn > 1;--> statement-breakpoint
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_user_id_unique" UNIQUE("user_id");
