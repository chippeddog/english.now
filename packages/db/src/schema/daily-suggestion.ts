import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export type DailyActivityItem = {
	id: string;
	emoji: string;
	title: string;
	description: string;
	duration: number;
	type: "pronunciation" | "conversation";
	typeLabel: string;
	metadata: {
		scenario?: string;
		scenarioName?: string;
		scenarioDescription?: string;
		aiRole?: string;
		cefrLevel?: string;
	};
	completedAt: string | null;
	sessionId: string | null;
};

export const dailySuggestion = pgTable("daily_suggestion", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	activities: jsonb("activities").$type<DailyActivityItem[]>().notNull(),
	generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

export type DailySuggestion = typeof dailySuggestion.$inferSelect;
export type NewDailySuggestion = typeof dailySuggestion.$inferInsert;
