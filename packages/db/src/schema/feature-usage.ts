import {
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const featureUsageType = pgEnum("feature_usage_type", [
	"conversation_session",
	"pronunciation_session",
	"lesson_start",
	"vocabulary_add",
	"vocabulary_review",
]);

export const featureUsage = pgTable(
	"feature_usage",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		dayKey: text("day_key").notNull(),
		timezone: text("timezone").notNull(),
		feature: featureUsageType("feature").notNull(),
		resourceId: text("resource_id").notNull().default(""),
		count: integer("count").notNull().default(1),
		metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => ({
		userDayFeatureIdx: index("feature_usage_user_day_feature_idx").on(
			table.userId,
			table.dayKey,
			table.feature,
		),
		userDayFeatureResourceUq: uniqueIndex(
			"feature_usage_user_day_feature_resource_uq",
		).on(table.userId, table.dayKey, table.feature, table.resourceId),
	}),
);

export type FeatureUsage = typeof featureUsage.$inferSelect;
export type NewFeatureUsage = typeof featureUsage.$inferInsert;
export type FeatureUsageType = (typeof featureUsageType.enumValues)[number];
