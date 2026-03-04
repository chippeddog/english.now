import {
	and,
	course,
	courseVersion,
	db,
	desc,
	enrollment,
	eq,
	userProfile,
} from "@english.now/db";

const LEVEL_TO_CEFR: Record<string, string> = {
	beginner: "A1",
	elementary: "A2",
	intermediate: "B1",
	"upper-intermediate": "B2",
	advanced: "C1",
};

export async function enrollUser(
	userId: string,
): Promise<{ enrollmentId: string }> {
	const [profile] = await db
		.select()
		.from(userProfile)
		.where(eq(userProfile.userId, userId))
		.limit(1);

	if (!profile) {
		throw new Error("User profile not found");
	}

	const cefrLevel = LEVEL_TO_CEFR[profile.level ?? "intermediate"] ?? "B1";

	const [existing] = await db
		.select({ id: enrollment.id })
		.from(enrollment)
		.where(eq(enrollment.userId, userId))
		.limit(1);

	if (existing) {
		return { enrollmentId: existing.id };
	}

	const [cv] = await db
		.select({ id: courseVersion.id })
		.from(courseVersion)
		.innerJoin(course, eq(course.id, courseVersion.courseId))
		.where(
			and(
				eq(course.level, cefrLevel as "A1" | "A2" | "B1" | "B2" | "C1" | "C2"),
				eq(course.isActive, true),
				eq(courseVersion.status, "published"),
			),
		)
		.orderBy(desc(courseVersion.version))
		.limit(1);

	if (!cv) {
		throw new Error(`No published course found for level ${cefrLevel}`);
	}

	const enrollmentId = crypto.randomUUID();
	await db.insert(enrollment).values({
		id: enrollmentId,
		userId,
		courseVersionId: cv.id,
		status: "active",
	});

	return { enrollmentId };
}
