import { describe, expect, it } from "vitest";
import {
	decideTimeZoneChange,
	isValidTimeZone,
	safeTimeZone,
	TIMEZONE_CHANGE_COOLDOWN_MS,
	timeZoneSchema,
} from "./timezone";

describe("time zone validation", () => {
	it("accepts IANA zones and rejects anything else", () => {
		expect(isValidTimeZone("Europe/Kyiv")).toBe(true);
		expect(isValidTimeZone("UTC")).toBe(true);
		expect(isValidTimeZone("Mars/Olympus_Mons")).toBe(false);
		expect(timeZoneSchema.safeParse("'; drop table x;--").success).toBe(false);
	});

	it("falls back to UTC for missing or invalid zones", () => {
		expect(safeTimeZone(null)).toBe("UTC");
		expect(safeTimeZone("bogus")).toBe("UTC");
		expect(safeTimeZone("Asia/Tokyo")).toBe("Asia/Tokyo");
	});
});

describe("decideTimeZoneChange", () => {
	const now = new Date("2026-11-11T12:00:00.000Z");

	it("allows the first time zone and unchanged values", () => {
		expect(
			decideTimeZoneChange({
				current: null,
				next: "UTC",
				lastChangedAt: null,
				now,
			}),
		).toEqual({ allowed: true, changed: true });
		expect(
			decideTimeZoneChange({
				current: "UTC",
				next: "UTC",
				lastChangedAt: now,
				now,
			}),
		).toEqual({ allowed: true, changed: false });
	});

	it("blocks a second change within the cooldown", () => {
		const lastChangedAt = new Date(now.getTime() - 60 * 60 * 1000);
		const decision = decideTimeZoneChange({
			current: "UTC",
			next: "Pacific/Kiritimati",
			lastChangedAt,
			now,
		});
		expect(decision).toEqual({
			allowed: false,
			retryAt: new Date(lastChangedAt.getTime() + TIMEZONE_CHANGE_COOLDOWN_MS),
		});
	});

	it("allows a change after the cooldown", () => {
		expect(
			decideTimeZoneChange({
				current: "UTC",
				next: "Europe/Kyiv",
				lastChangedAt: new Date(now.getTime() - TIMEZONE_CHANGE_COOLDOWN_MS),
				now,
			}),
		).toEqual({ allowed: true, changed: true });
	});
});
