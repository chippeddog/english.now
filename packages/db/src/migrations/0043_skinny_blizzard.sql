CREATE TABLE "grammar_practice_item" (
	"id" text PRIMARY KEY NOT NULL,
	"set_id" text NOT NULL,
	"grammar_topic_id" text NOT NULL,
	"phase" text NOT NULL,
	"type" text NOT NULL,
	"difficulty" text NOT NULL,
	"rule_title" text NOT NULL,
	"item" jsonb NOT NULL,
	"item_hash" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grammar_practice_set" (
	"id" text PRIMARY KEY NOT NULL,
	"grammar_topic_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"item_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "grammar_practice_item" ADD CONSTRAINT "grammar_practice_item_set_id_grammar_practice_set_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."grammar_practice_set"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_practice_item" ADD CONSTRAINT "grammar_practice_item_grammar_topic_id_grammar_topic_id_fk" FOREIGN KEY ("grammar_topic_id") REFERENCES "public"."grammar_topic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_practice_set" ADD CONSTRAINT "grammar_practice_set_grammar_topic_id_grammar_topic_id_fk" FOREIGN KEY ("grammar_topic_id") REFERENCES "public"."grammar_topic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "grammar_practice_item_topic_idx" ON "grammar_practice_item" USING btree ("grammar_topic_id","is_active");--> statement-breakpoint
CREATE INDEX "grammar_practice_item_set_idx" ON "grammar_practice_item" USING btree ("set_id");--> statement-breakpoint
CREATE INDEX "grammar_practice_item_metadata_idx" ON "grammar_practice_item" USING btree ("grammar_topic_id","phase","difficulty");--> statement-breakpoint
CREATE UNIQUE INDEX "grammar_practice_item_set_hash_uq" ON "grammar_practice_item" USING btree ("set_id","item_hash");--> statement-breakpoint
CREATE INDEX "grammar_practice_set_topic_idx" ON "grammar_practice_set" USING btree ("grammar_topic_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "grammar_practice_set_topic_version_uq" ON "grammar_practice_set" USING btree ("grammar_topic_id","version");