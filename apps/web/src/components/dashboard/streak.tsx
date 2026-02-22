import { FlameIcon, InfoIcon } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface StreakProps {
	currentStreak: number;
	longestStreak: number;
	timezone: string | null;
	activityDates?: string[];
	isLoading: boolean;
}

const WEEK_DAYS = [
	{ key: "mon", label: "M" },
	{ key: "tue", label: "T" },
	{ key: "wed", label: "W" },
	{ key: "thu", label: "T" },
	{ key: "fri", label: "F" },
	{ key: "sat", label: "S" },
	{ key: "sun", label: "S" },
] as const;

const DAY_NAME_TO_INDEX: Record<string, number> = {
	Mon: 0,
	Tue: 1,
	Wed: 2,
	Thu: 3,
	Fri: 4,
	Sat: 5,
	Sun: 6,
};

function getTodayIndex(timezone: string): number {
	const dayName = new Date().toLocaleDateString("en-US", {
		timeZone: timezone,
		weekday: "short",
	});
	return DAY_NAME_TO_INDEX[dayName] ?? 0;
}

function getWeekDates(timezone: string): string[] {
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

export default function Streak({
	currentStreak,
	longestStreak,
	timezone,
	activityDates = [],
	isLoading,
}: StreakProps) {
	const resolvedTimezone =
		timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
	const todayIndex = getTodayIndex(resolvedTimezone);

	const streak = currentStreak ?? 0;

	const completedDays = useMemo(() => {
		const weekDates = getWeekDates(resolvedTimezone);
		const activeSet = new Set(activityDates);
		return WEEK_DAYS.filter((_, i) => activeSet.has(weekDates[i])).map(
			(d) => d.key,
		);
	}, [activityDates, resolvedTimezone]);
	return (
		<div
			className="overflow-hidden rounded-3xl bg-white p-2.5"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<div className="mb-2.5 flex gap-2 pl-1.5 font-medium">
				<div>
					<h3 className="flex items-center gap-2 font-lyon font-semibold text-xl">
						{streak} day streak
						<Tooltip>
							<TooltipTrigger>
								<InfoIcon className="size-4 text-neutral-400" strokeWidth={2} />
							</TooltipTrigger>
							<TooltipContent>
								<p>
									Your current streak is {streak} days.
									<br />
									Your longest streak is {longestStreak} days.
								</p>
							</TooltipContent>
						</Tooltip>
					</h3>
					{/* <p className="text-muted-foreground text-sm">
						Time to start your first lesson!
					</p> */}
				</div>
			</div>

			<div className="rounded-[1.2rem] border border-border/50 p-3">
				<div className="flex items-center justify-between">
					{WEEK_DAYS.map((day, index) => {
						const isToday = index === todayIndex;
						const isCompleted = completedDays.includes(day.key);

						return (
							<div key={day.key} className="flex flex-col items-center gap-2">
								<span className="font-medium text-neutral-500 text-xs">
									{day.label}
								</span>

								{isLoading ? (
									<Skeleton className="size-8.5 animate-pulse rounded-full" />
								) : (
									<div
										className={cn(
											"flex size-8.5 items-center justify-center rounded-full transition-all",
											isCompleted
												? "border border-amber-400 bg-radial from-text-amber-200 to-amber-400"
												: isToday
													? "border border-amber-400 bg-transparent"
													: "bg-neutral-100",
										)}
									>
										{isCompleted && (
											<FlameIcon
												className="size-4 text-amber-600"
												fill="currentColor"
											/>
										)}
									</div>
								)}
							</div>
						);
					})}
				</div>
				{/* <div className="grid grid-cols-2 gap-4 pb-0">
					<div className="flex flex-col">
						<div className="mb-1 flex items-center font-medium text-muted-foreground text-xs">
							Current Streak
						</div>
						<span className="font-semibold">{currentStreak} days</span>
					</div>

					<div className="flex flex-col">
						<div className="mb-1 flex items-center font-medium text-muted-foreground text-xs">
							Longest Streak
						</div>
						<span className="font-semibold">{longestStreak} days</span>
					</div>
				</div> */}
			</div>
		</div>
	);
}
