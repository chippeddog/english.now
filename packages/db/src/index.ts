import { env } from "@english.now/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

export const db = drizzle(env.DATABASE_URL);

// Re-export drizzle-orm helpers
export { and, asc, desc, eq, isNull, lt, or, sql } from "drizzle-orm";

// Export schemas
export * from "./schema/auth";
export * from "./schema/content";
export * from "./schema/conversation";
export * from "./schema/daily-suggestion";
export * from "./schema/issue-report";
export * from "./schema/lesson-attempt";
export * from "./schema/profile";
export * from "./schema/pronunciation";
export * from "./schema/rate-limit";
export * from "./schema/subscription";
export * from "./schema/vocabulary";
