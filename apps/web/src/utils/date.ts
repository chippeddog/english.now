const DAY_NAME_TO_INDEX: Record<string, number> = {
	Mon: 0,
	Tue: 1,
	Wed: 2,
	Thu: 3,
	Fri: 4,
	Sat: 5,
	Sun: 6,
};

export function formatRelativeDate(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return "Just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays === 1) return "Yesterday";
	if (diffDays < 7) return `${diffDays}d ago`;
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getTodayIndex(timezone: string): number {
	const dayName = new Date().toLocaleDateString("en-US", {
		timeZone: timezone,
		weekday: "short",
	});
	return DAY_NAME_TO_INDEX[dayName] ?? 0;
}

export function getWeekDates(timezone: string): string[] {
	const now = new Date();
	const todayIndex = getTodayIndex(timezone);
	const dates: string[] = [];

	for (let i = 0; i < 7; i++) {
		const d = new Date(now);
		d.setDate(d.getDate() - todayIndex + i);
		dates.push(d.toLocaleDateString("en-CA", { timeZone: timezone }));
	}
	return dates;
}
