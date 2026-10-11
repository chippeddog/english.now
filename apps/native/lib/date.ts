const DAY_NAME_TO_INDEX: Record<string, number> = {
	Mon: 0,
	Tue: 1,
	Wed: 2,
	Thu: 3,
	Fri: 4,
	Sat: 5,
	Sun: 6,
};

export const WEEKDAY_SHORT = [
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat",
	"Sun",
] as const;

export function getDeviceTimezone() {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
	} catch {
		return "UTC";
	}
}

export function getTodayIndex(timezone: string): number {
	const dayName = new Date().toLocaleDateString("en-US", {
		timeZone: timezone,
		weekday: "short",
	});
	return DAY_NAME_TO_INDEX[dayName] ?? 0;
}

function toYMD(date: Date, timezone: string) {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(date);
}

export function getWeekDates(timezone: string): string[] {
	const now = new Date();
	const todayIndex = getTodayIndex(timezone);
	const dates: string[] = [];

	for (let i = 0; i < 7; i++) {
		const d = new Date(now);
		d.setDate(d.getDate() - todayIndex + i);
		dates.push(toYMD(d, timezone));
	}
	return dates;
}

export type PracticeDay = {
	label: string;
	minutes: number;
	isToday: boolean;
	isFuture: boolean;
};

export function buildWeekData(
	practiceData: { date: string; seconds: number }[],
	timezone: string,
): PracticeDay[] {
	const todayIndex = getTodayIndex(timezone);
	const secondsByDate = new Map(practiceData.map((d) => [d.date, d.seconds]));

	return getWeekDates(timezone).map((date, index) => ({
		label: WEEKDAY_SHORT[index],
		minutes: (secondsByDate.get(date) ?? 0) / 60,
		isToday: index === todayIndex,
		isFuture: index > todayIndex,
	}));
}

export type Trend = "up" | "down" | "flat";

export function computeTrend(week: PracticeDay[]): Trend {
	const played = week.filter((d) => !d.isFuture);
	if (played.length < 2) return "flat";

	const mid = Math.floor(played.length / 2);
	const avg = (list: PracticeDay[]) =>
		list.reduce((sum, d) => sum + d.minutes, 0) / Math.max(1, list.length);

	const diff = avg(played.slice(mid)) - avg(played.slice(0, mid));
	if (Math.abs(diff) < 0.5) return "flat";
	return diff > 0 ? "up" : "down";
}

export function formatMinutes(minutes: number): string {
	if (minutes <= 0) return "0 min";
	if (minutes < 1) return `${Math.max(1, Math.round(minutes * 60))} sec`;
	return `${Math.round(minutes)} min`;
}
