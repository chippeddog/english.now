import { describe, expect, it } from "vitest";
import { getDayKey } from "./daily-practice-plan";
import { getWeekDayKeys, isWithinUsageLimit } from "./feature-usage";

describe("getWeekDayKeys", () => {
	it("returns Monday through Sunday for a mid-week day", () => {
		expect(getWeekDayKeys("2026-11-11")).toEqual([
			"2026-11-09",
			"2026-11-10",
			"2026-11-11",
			"2026-11-12",
			"2026-11-13",
			"2026-11-14",
			"2026-11-15",
		]);
	});

	it("treats Sunday as the end of the week", () => {
		expect(getWeekDayKeys("2026-11-15")[0]).toBe("2026-11-09");
	});

	it("crosses month and year boundaries", () => {
		expect(getWeekDayKeys("2027-01-01")).toEqual([
			"2026-12-28",
			"2026-12-29",
			"2026-12-30",
			"2026-12-31",
			"2027-01-01",
			"2027-01-02",
			"2027-01-03",
		]);
	});
});

describe("isWithinUsageLimit", () => {
	it("allows usage up to and including the limit", () => {
		expect(isWithinUsageLimit(0, 1, 1)).toBe(true);
		expect(isWithinUsageLimit(14, 1, 15)).toBe(true);
		expect(isWithinUsageLimit(15, 1, 15)).toBe(false);
		expect(isWithinUsageLimit(10, 6, 15)).toBe(false);
	});
});

describe("getDayKey", () => {
	const instant = new Date("2026-11-11T23:30:00.000Z");

	it("uses the user's time zone to pick the calendar day", () => {
		expect(getDayKey(instant, "UTC")).toBe("2026-11-11");
		expect(getDayKey(instant, "Europe/Kyiv")).toBe("2026-11-12");
		expect(getDayKey(instant, "America/Los_Angeles")).toBe("2026-11-11");
	});

	it("falls back to UTC for an invalid time zone instead of throwing", () => {
		expect(getDayKey(instant, "Not/AZone")).toBe("2026-11-11");
	});
});
