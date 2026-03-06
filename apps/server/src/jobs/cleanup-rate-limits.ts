import { db, rateLimits, sql } from "@english.now/db";
import { lt } from "drizzle-orm";
import type { PgBoss } from "pg-boss";

const JOB_NAME = "cleanup-rate-limits";

export async function registerCleanupRateLimitsJob(boss: PgBoss) {
	await boss.createQueue(JOB_NAME);

	await boss.schedule(JOB_NAME, "0 0 * * *", {});

	boss.work(JOB_NAME, async () => {
		const tenMinutesAgo = sql`now() - interval '24 hours'`;

		const deleted = await db
			.delete(rateLimits)
			.where(lt(rateLimits.windowStart, tenMinutesAgo))
			.returning({ id: rateLimits.id });

		console.log(
			`[${JOB_NAME}] removed ${deleted.length} expired rate-limit rows`,
		);
	});
}
