import {
	db,
	eq,
	type FeatureUsageType,
	featureUsage,
	sql,
	userProfile,
} from "@english.now/db";
import { getDayKey } from "./daily-practice-plan";

type FeatureUsageRecordOptions = {
	userId: string;
	feature: FeatureUsageType;
	resourceId?: string | null;
	count?: number;
	metadata?: Record<string, unknown> | null;
};

export type UserDayContext = {
	dayKey: string;
	timezone: string;
};

export function isUnsupportedFeatureUsageValue(
	error: unknown,
	feature: FeatureUsageType,
) {
	if (!(error instanceof Error)) {
		return false;
	}

	const message = error.message.toLowerCase();
	return (
		message.includes("feature_usage_type") &&
		message.includes(feature.toLowerCase())
	);
}

export async function getUserDayContext(
	userId: string,
): Promise<UserDayContext> {
	const [profile] = await db
		.select({ timezone: userProfile.timezone })
		.from(userProfile)
		.where(eq(userProfile.userId, userId))
		.limit(1);

	const timezone = profile?.timezone || "UTC";

	return {
		timezone,
		dayKey: getDayKey(new Date(), timezone),
	};
}

export async function getDailyFeatureUsageRows(
	userId: string,
	feature: FeatureUsageType,
) {
	const { dayKey } = await getUserDayContext(userId);

	return db
		.select()
		.from(featureUsage)
		.where(
			sql`${featureUsage.userId} = ${userId} and ${featureUsage.dayKey} = ${dayKey} and ${featureUsage.feature} = ${feature}`,
		);
}

export async function getDailyFeatureUsageTotal(
	userId: string,
	feature: FeatureUsageType,
) {
	const rows = await getDailyFeatureUsageRows(userId, feature);

	return rows.reduce((total, row) => total + row.count, 0);
}

export async function getDailyFeatureUsageResource(
	userId: string,
	feature: FeatureUsageType,
	resourceId: string,
) {
	const { dayKey } = await getUserDayContext(userId);

	const [row] = await db
		.select()
		.from(featureUsage)
		.where(
			sql`${featureUsage.userId} = ${userId} and ${featureUsage.dayKey} = ${dayKey} and ${featureUsage.feature} = ${feature} and ${featureUsage.resourceId} = ${resourceId}`,
		)
		.limit(1);

	return row ?? null;
}

export async function getLatestDailyFeatureUsage(
	userId: string,
	feature: FeatureUsageType,
) {
	const rows = await getDailyFeatureUsageRows(userId, feature);

	return (
		rows.sort((a, b) => {
			const aTime = a.updatedAt?.getTime() ?? a.createdAt?.getTime() ?? 0;
			const bTime = b.updatedAt?.getTime() ?? b.createdAt?.getTime() ?? 0;
			return bTime - aTime;
		})[0] ?? null
	);
}

export async function recordDailyFeatureUsage({
	userId,
	feature,
	resourceId,
	count = 1,
	metadata = null,
}: FeatureUsageRecordOptions) {
	const { dayKey, timezone } = await getUserDayContext(userId);
	const normalizedResourceId = resourceId ?? "";
	const now = new Date();

	const [row] = await db
		.insert(featureUsage)
		.values({
			id: crypto.randomUUID(),
			userId,
			dayKey,
			timezone,
			feature,
			resourceId: normalizedResourceId,
			count,
			metadata,
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: [
				featureUsage.userId,
				featureUsage.dayKey,
				featureUsage.feature,
				featureUsage.resourceId,
			],
			set: {
				count: sql`${featureUsage.count} + ${count}`,
				metadata: metadata ?? sql`${featureUsage.metadata}`,
				timezone,
				updatedAt: now,
			},
		})
		.returning();

	return row ?? null;
}
