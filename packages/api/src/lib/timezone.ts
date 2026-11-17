import { z } from "zod";

/** Daily limits are keyed by the profile timezone, so changing it is throttled. */
export const TIMEZONE_CHANGE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function isValidTimeZone(timeZone: string): boolean {
	try {
		new Intl.DateTimeFormat("en-US", { timeZone });
		return true;
	} catch {
		return false;
	}
}

export const timeZoneSchema = z
	.string()
	.min(1)
	.max(64)
	.refine(isValidTimeZone, { message: "Invalid time zone" });

/** Returns a usable IANA time zone, falling back to UTC for missing or invalid values. */
export function safeTimeZone(timeZone: string | null | undefined): string {
	return timeZone && isValidTimeZone(timeZone) ? timeZone : "UTC";
}

export type TimeZoneChangeDecision =
	| { allowed: true; changed: boolean }
	| { allowed: false; retryAt: Date };

export function decideTimeZoneChange(input: {
	current: string | null;
	next: string;
	lastChangedAt: Date | null;
	now?: Date;
}): TimeZoneChangeDecision {
	if (input.current === input.next) {
		return { allowed: true, changed: false };
	}
	// Setting the first time zone (e.g. during onboarding) is always allowed.
	if (!input.current || !input.lastChangedAt) {
		return { allowed: true, changed: true };
	}

	const now = input.now ?? new Date();
	const retryAt = new Date(
		input.lastChangedAt.getTime() + TIMEZONE_CHANGE_COOLDOWN_MS,
	);
	if (now < retryAt) {
		return { allowed: false, retryAt };
	}
	return { allowed: true, changed: true };
}
