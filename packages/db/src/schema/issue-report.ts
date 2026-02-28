import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const issueReport = pgTable("issue_report", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	sessionId: text("session_id").notNull(),
	sessionType: text("session_type")
		.notNull()
		.$type<"conversation" | "pronunciation">(),
	category: text("category").notNull(),
	description: text("description"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type IssueReport = typeof issueReport.$inferSelect;
export type NewIssueReport = typeof issueReport.$inferInsert;
