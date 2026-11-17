import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const subscription = pgTable("subscription", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	paddleSubscriptionId: text("paddle_subscription_id").notNull().unique(),
	paddleCustomerId: text("paddle_customer_id"),
	paddlePriceId: text("paddle_price_id"),
	status: text("status").notNull(), // active, trialing, paused, canceled, past_due
	currentPeriodStart: timestamp("current_period_start"),
	currentPeriodEnd: timestamp("current_period_end"),
	canceledAt: timestamp("canceled_at"),
	// When the last applied Paddle event occurred; older events are ignored.
	paddleEventOccurredAt: timestamp("paddle_event_occurred_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
