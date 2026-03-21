ALTER TABLE "conversation_session" ADD COLUMN "mode" text DEFAULT 'general-conversation' NOT NULL;

UPDATE "conversation_session"
SET "mode" = CASE
	WHEN "context"->>'mode' = 'mini-class' THEN 'mini-class'
	WHEN "context"->>'mode' = 'roleplay' THEN 'roleplay'
	WHEN "context"->>'scenarioType' = 'roleplay' THEN 'roleplay'
	ELSE 'general-conversation'
END;