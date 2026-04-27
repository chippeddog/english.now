import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { enrollment } from "../schema/curriculum";
import { userProfile } from "../schema/profile";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({
	path: path.resolve(__dirname, "../../../../apps/server/.env"),
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error(
		"DATABASE_URL is required to backfill user_profile.active_enrollment_id.",
	);
}

const db = drizzle(databaseUrl);

/**
 * One-shot backfill for `user_profile.active_enrollment_id` after the
 * multi-enrollment migration. Points every profile without a primary
 * enrollment pointer at their most recent active enrollment (falling back to
 * the most recent enrollment of any status). CEFR is not stored on
 * `user_profile`; it is always resolved via the active enrollment's
 * `course_version → course.level`.
 */
async function backfillActiveEnrollment() {
	console.log(
		"[backfill] Loading profiles missing active_enrollment_id…",
	);

	const profiles = await db
		.select({
			id: userProfile.id,
			userId: userProfile.userId,
			activeEnrollmentId: userProfile.activeEnrollmentId,
		})
		.from(userProfile);

	let updated = 0;

	for (const profile of profiles) {
		if (profile.activeEnrollmentId) continue;

		const [active] = await db
			.select({ id: enrollment.id })
			.from(enrollment)
			.where(
				and(
					eq(enrollment.userId, profile.userId),
					eq(enrollment.status, "active"),
				),
			)
			.orderBy(desc(enrollment.enrolledAt))
			.limit(1);

		const [fallback] = active
			? [active]
			: await db
					.select({ id: enrollment.id })
					.from(enrollment)
					.where(eq(enrollment.userId, profile.userId))
					.orderBy(desc(enrollment.enrolledAt))
					.limit(1);

		if (!fallback) continue;

		await db
			.update(userProfile)
			.set({
				activeEnrollmentId: fallback.id,
				updatedAt: new Date(),
			})
			.where(eq(userProfile.id, profile.id));
		updated += 1;
	}

	console.log(
		`[backfill] Set active_enrollment_id on ${updated} profiles.`,
	);
}

backfillActiveEnrollment()
	.catch((error) => {
		console.error("[backfill] Failed:", error);
		process.exit(1);
	})
	.finally(() => {
		process.exit(0);
	});
