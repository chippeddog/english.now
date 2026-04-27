import {
	boolean,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { enrollment } from "./curriculum";

export const userProfile = pgTable("user_profile", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	nativeLanguage: text("native_language"),
	level: text("level"),
	activeEnrollmentId: text("active_enrollment_id").references(
		() => enrollment.id,
		{ onDelete: "set null" },
	),
	goal: text("goal"),
	dailyGoal: integer("daily_goal"),
	focusAreas: jsonb("focus_areas").$type<string[]>(),
	interests: jsonb("interests").$type<string[]>(),
	timezone: text("timezone"),
	isOnboardingCompleted: boolean("is_onboarding_completed")
		.notNull()
		.default(false),
	voiceModel: text("voice_model").default("aura-2-asteria-en"), // Deepgram voice model
	currentStreak: integer("current_streak").notNull().default(0),
	longestStreak: integer("longest_streak").notNull().default(0),
	lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userActivity = pgTable("user_activity", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	activityType: text("activity_type").notNull(),
	durationSeconds: integer("duration_seconds"),
	completedAt: timestamp("completed_at").notNull().defaultNow(),
	activityAt: timestamp("activity_at").notNull().defaultNow(),
});
