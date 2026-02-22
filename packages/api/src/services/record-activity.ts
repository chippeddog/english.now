import { db, eq, userActivity, userProfile } from "@english.now/db";

export async function recordActivity(userId: string, activityType: string) {
	const now = new Date();

	await db.insert(userActivity).values({
		id: crypto.randomUUID(),
		userId,
		activityType,
		completedAt: now,
		activityAt: now,
	});

	const [profile] = await db
		.select({
			currentStreak: userProfile.currentStreak,
			longestStreak: userProfile.longestStreak,
			lastActivityAt: userProfile.lastActivityAt,
			timezone: userProfile.timezone,
		})
		.from(userProfile)
		.where(eq(userProfile.userId, userId))
		.limit(1);

	if (!profile) return;

	const timezone = profile.timezone || "UTC";

	const todayInTz = new Date(
		now.toLocaleString("en-US", { timeZone: timezone }),
	);
	const lastActivityInTz = new Date(
		profile.lastActivityAt.toLocaleString("en-US", { timeZone: timezone }),
	);

	const todayDate = new Date(
		todayInTz.getFullYear(),
		todayInTz.getMonth(),
		todayInTz.getDate(),
	);
	const lastActivityDate = new Date(
		lastActivityInTz.getFullYear(),
		lastActivityInTz.getMonth(),
		lastActivityInTz.getDate(),
	);

	const diffDays = Math.floor(
		(todayDate.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24),
	);

	let newStreak: number;

	if (diffDays === 0) {
		newStreak = Math.max(profile.currentStreak, 1);
	} else if (diffDays === 1) {
		newStreak = profile.currentStreak + 1;
	} else {
		newStreak = 1;
	}

	const newLongest = Math.max(newStreak, profile.longestStreak);

	await db
		.update(userProfile)
		.set({
			currentStreak: newStreak,
			longestStreak: newLongest,
			lastActivityAt: now,
			updatedAt: now,
		})
		.where(eq(userProfile.userId, userId));
}
