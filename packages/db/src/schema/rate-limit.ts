import {
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";

export const rateLimits = pgTable(
	"rate_limits",
	{
		id: serial("id").primaryKey(),
		key: text("key").notNull(), // e.g. "user:abc123:/api/conversation/send"
		windowStart: timestamp("window_start").notNull(),
		count: integer("count").notNull().default(1),
	},
	(table) => [
		unique("rate_limit_key_window_unique").on(table.key, table.windowStart),
	],
);

export type RateLimit = typeof rateLimits.$inferSelect;
export type NewRateLimit = typeof rateLimits.$inferInsert;
