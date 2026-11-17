import { db, eq, userProfile } from "@english.now/db";
import { TRPCError } from "@trpc/server";
import { decideTimeZoneChange } from "../lib/timezone";

/**
 * Returns the profile fields to write for a requested time zone, or throws
 * when the user changed it too recently. Callers must validate `next` first.
 */
export async function getTimeZoneUpdate(
	userId: string,
	next: string,
): Promise<{ timezone?: string; timezoneUpdatedAt?: Date }> {
	const [profile] = await db
		.select({
			timezone: userProfile.timezone,
			timezoneUpdatedAt: userProfile.timezoneUpdatedAt,
		})
		.from(userProfile)
		.where(eq(userProfile.userId, userId))
		.limit(1);

	const decision = decideTimeZoneChange({
		current: profile?.timezone ?? null,
		next,
		lastChangedAt: profile?.timezoneUpdatedAt ?? null,
	});

	if (!decision.allowed) {
		throw new TRPCError({
			code: "TOO_MANY_REQUESTS",
			message: "TIMEZONE_CHANGE_TOO_SOON",
			cause: { retryAt: decision.retryAt.toISOString() },
		});
	}

	return decision.changed
		? { timezone: next, timezoneUpdatedAt: new Date() }
		: {};
}
