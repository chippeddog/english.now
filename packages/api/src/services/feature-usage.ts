import {
	and,
	db,
	eq,
	type FeatureUsageType,
	featureUsage,
	inArray,
	sql,
	userProfile,
} from "@english.now/db";
import { getDayKey } from "./daily-practice-plan";

export type DbExecutor =
	| typeof db
	| Parameters<Parameters<typeof db.transaction>[0]>[0];

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

export type FeatureUsageLimit =
	| { period: "day"; max: number }
	| { period: "week"; max: number; features: FeatureUsageType[] };

export type ConsumeFeatureUsageResult = {
	/** The action may proceed. */
	consumed: boolean;
	/** A new usage unit was recorded (and should be released if the action fails). */
	recorded: boolean;
	used: number;
	limit: number | null;
};

export function getWeekDayKeys(dayKey: string) {
	const date = new Date(`${dayKey}T00:00:00.000Z`);
	const daysSinceMonday = (date.getUTCDay() + 6) % 7;
	date.setUTCDate(date.getUTCDate() - daysSinceMonday);

	return Array.from({ length: 7 }, (_, index) => {
		const weekDate = new Date(date);
		weekDate.setUTCDate(date.getUTCDate() + index);
		return weekDate.toISOString().slice(0, 10);
	});
}

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
	executor: DbExecutor = db,
): Promise<UserDayContext> {
	const [profile] = await executor
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
	executor: DbExecutor = db,
) {
	const { dayKey } = await getUserDayContext(userId, executor);

	return executor
		.select()
		.from(featureUsage)
		.where(
			sql`${featureUsage.userId} = ${userId} and ${featureUsage.dayKey} = ${dayKey} and ${featureUsage.feature} = ${feature}`,
		);
}

export async function getDailyFeatureUsageTotal(
	userId: string,
	feature: FeatureUsageType,
	executor: DbExecutor = db,
) {
	const rows = await getDailyFeatureUsageRows(userId, feature, executor);

	return rows.reduce((total, row) => total + row.count, 0);
}

export async function getWeeklyFeatureUsageRows(
	userId: string,
	features: FeatureUsageType[],
	executor: DbExecutor = db,
) {
	const { dayKey } = await getUserDayContext(userId, executor);
	const weekDayKeys = getWeekDayKeys(dayKey);

	return executor
		.select()
		.from(featureUsage)
		.where(
			and(
				eq(featureUsage.userId, userId),
				inArray(featureUsage.dayKey, weekDayKeys),
				inArray(featureUsage.feature, features),
			),
		);
}

export async function getWeeklyFeatureUsageTotal(
	userId: string,
	features: FeatureUsageType[],
	executor: DbExecutor = db,
) {
	const rows = await getWeeklyFeatureUsageRows(userId, features, executor);

	return rows.reduce((total, row) => total + row.count, 0);
}

export async function getDailyFeatureUsageResource(
	userId: string,
	feature: FeatureUsageType,
	resourceId: string,
	executor: DbExecutor = db,
) {
	const { dayKey } = await getUserDayContext(userId, executor);

	const [row] = await executor
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

export async function getLatestWeeklyFeatureUsage(
	userId: string,
	feature: FeatureUsageType,
) {
	const rows = await getWeeklyFeatureUsageRows(userId, [feature]);

	return (
		rows.sort((a, b) => {
			const aTime = a.updatedAt?.getTime() ?? a.createdAt?.getTime() ?? 0;
			const bTime = b.updatedAt?.getTime() ?? b.createdAt?.getTime() ?? 0;
			return bTime - aTime;
		})[0] ?? null
	);
}

export async function recordDailyFeatureUsage(
	{
		userId,
		feature,
		resourceId,
		count = 1,
		metadata = null,
	}: FeatureUsageRecordOptions,
	executor: DbExecutor = db,
) {
	const { dayKey, timezone } = await getUserDayContext(userId, executor);
	const normalizedResourceId = resourceId ?? "";
	const now = new Date();

	const [row] = await executor
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

/**
 * Runs `fn` in a transaction holding a Postgres advisory lock for `key`, so
 * check-then-insert sequences for the same key cannot interleave. Everything
 * inside `fn` must use the provided transaction, never the shared `db`, or
 * the connection pool can deadlock.
 */
export async function withAdvisoryLock<T>(
	key: string,
	fn: (tx: DbExecutor) => Promise<T>,
): Promise<T> {
	return db.transaction(async (tx) => {
		await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${key}))`);
		return fn(tx);
	});
}

export function withUserUsageLock<T>(
	userId: string,
	fn: (tx: DbExecutor) => Promise<T>,
): Promise<T> {
	return withAdvisoryLock(`feature-usage:${userId}`, fn);
}

export function isWithinUsageLimit(used: number, count: number, max: number) {
	return used + count <= max;
}

/**
 * Atomically checks a usage limit and records usage when it is not exceeded.
 * Concurrent requests for the same user are serialized, so free-tier limits
 * cannot be bypassed by firing requests in parallel. Pass `limit: null` for
 * unlimited (Pro) users to only record usage.
 */
export async function consumeFeatureUsage(
	options: FeatureUsageRecordOptions & {
		limit: FeatureUsageLimit | null;
		/** Usage already recorded for this resource today is free (e.g. reopening a lesson). */
		freeIfResourceUsedToday?: boolean;
	},
): Promise<ConsumeFeatureUsageResult> {
	const { limit, freeIfResourceUsedToday, ...record } = options;
	const count = record.count ?? 1;

	return withUserUsageLock(record.userId, async (tx) => {
		if (freeIfResourceUsedToday && record.resourceId) {
			const existing = await getDailyFeatureUsageResource(
				record.userId,
				record.feature,
				record.resourceId,
				tx,
			);
			if (existing) {
				const used = await getDailyFeatureUsageTotal(
					record.userId,
					record.feature,
					tx,
				);
				return {
					consumed: true,
					recorded: false,
					used,
					limit: limit?.max ?? null,
				};
			}
		}

		if (!limit) {
			await recordDailyFeatureUsage(record, tx);
			return { consumed: true, recorded: true, used: 0, limit: null };
		}

		const used =
			limit.period === "day"
				? await getDailyFeatureUsageTotal(record.userId, record.feature, tx)
				: await getWeeklyFeatureUsageTotal(record.userId, limit.features, tx);

		if (!isWithinUsageLimit(used, count, limit.max)) {
			return { consumed: false, recorded: false, used, limit: limit.max };
		}

		await recordDailyFeatureUsage(record, tx);
		return {
			consumed: true,
			recorded: true,
			used: used + count,
			limit: limit.max,
		};
	});
}

/** Gives back usage reserved by `consumeFeatureUsage` when the action then failed. */
export async function releaseFeatureUsage({
	userId,
	feature,
	resourceId,
	count = 1,
}: Omit<FeatureUsageRecordOptions, "metadata">) {
	const { dayKey } = await getUserDayContext(userId);

	await db
		.update(featureUsage)
		.set({
			count: sql`greatest(${featureUsage.count} - ${count}, 0)`,
			updatedAt: new Date(),
		})
		.where(
			and(
				eq(featureUsage.userId, userId),
				eq(featureUsage.dayKey, dayKey),
				eq(featureUsage.feature, feature),
				eq(featureUsage.resourceId, resourceId ?? ""),
			),
		);
}
