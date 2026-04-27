import {
	and,
	type CefrLevel,
	course,
	courseVersion,
	db,
	desc,
	enrollment,
	eq,
	userProfile,
} from "@english.now/db";

const LEVEL_TO_CEFR: Record<string, CefrLevel> = {
	beginner: "A1",
	elementary: "A2",
	intermediate: "B1",
	"upper-intermediate": "B2",
	advanced: "C1",
};

export function mapProfileLevelToCefr(
	level: string | null | undefined,
): CefrLevel {
	if (!level) return "B1";
	return LEVEL_TO_CEFR[level] ?? "B1";
}

/**
 * Ensure the user has an enrollment for the given CEFR level. Creates the
 * enrollment on demand against the latest published `course_version` and
 * returns the resolved enrollment id.
 *
 * If `targetLevel` is omitted, we derive the user's "primary" level from the
 * onboarding-proficiency bucket at `user_profile.level` and set
 * `user_profile.active_enrollment_id` to the resulting enrollment. The CEFR
 * itself lives on the linked `course.level` (via `active_enrollment_id`), so
 * there is no separate column to maintain on `user_profile`.
 */
export async function enrollUser(
	userId: string,
	targetLevel?: CefrLevel,
): Promise<{ enrollmentId: string; level: CefrLevel }> {
	const [profile] = await db
		.select()
		.from(userProfile)
		.where(eq(userProfile.userId, userId))
		.limit(1);

	if (!profile) {
		throw new Error("User profile not found");
	}

	const isDefaultEnrollment = targetLevel === undefined;
	const level: CefrLevel = targetLevel ?? mapProfileLevelToCefr(profile.level);

	const [cv] = await db
		.select({ id: courseVersion.id })
		.from(courseVersion)
		.innerJoin(course, eq(course.id, courseVersion.courseId))
		.where(
			and(
				eq(course.level, level),
				eq(course.isActive, true),
				eq(courseVersion.status, "published"),
			),
		)
		.orderBy(desc(courseVersion.version))
		.limit(1);

	if (!cv) {
		throw new Error(`No published course found for level ${level}`);
	}

	const [existing] = await db
		.select({ id: enrollment.id })
		.from(enrollment)
		.where(
			and(eq(enrollment.userId, userId), eq(enrollment.courseVersionId, cv.id)),
		)
		.limit(1);

	const enrollmentId = existing?.id ?? crypto.randomUUID();

	if (!existing) {
		await db.insert(enrollment).values({
			id: enrollmentId,
			userId,
			courseVersionId: cv.id,
			status: "active",
		});
	}

	if (isDefaultEnrollment && !profile.activeEnrollmentId) {
		await db
			.update(userProfile)
			.set({ activeEnrollmentId: enrollmentId, updatedAt: new Date() })
			.where(eq(userProfile.id, profile.id));
	}

	return { enrollmentId, level };
}
