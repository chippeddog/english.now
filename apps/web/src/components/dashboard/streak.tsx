import { Trans, useTranslation } from "@english.now/i18n";
import { FlameIcon, InfoIcon } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { getTodayIndex, getWeekDates } from "@/utils/date";
import { Skeleton } from "../ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface StreakProps {
	currentStreak: number;
	longestStreak: number;
	timezone: string | null;
	activityDates?: string[];
	isLoading: boolean;
}

const WEEK_DAY_KEYS = [
	"mon",
	"tue",
	"wed",
	"thu",
	"fri",
	"sat",
	"sun",
] as const;

const WEEKDAY_REFERENCE_DATES = [
	new Date("2024-01-01T12:00:00Z"),
	new Date("2024-01-02T12:00:00Z"),
	new Date("2024-01-03T12:00:00Z"),
	new Date("2024-01-04T12:00:00Z"),
	new Date("2024-01-05T12:00:00Z"),
	new Date("2024-01-06T12:00:00Z"),
	new Date("2024-01-07T12:00:00Z"),
] as const;

export default function Streak({
	currentStreak,
	longestStreak,
	timezone,
	activityDates = [],
	isLoading,
}: StreakProps) {
	const { i18n, t } = useTranslation("app");
	const resolvedTimezone =
		timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
	const todayIndex = getTodayIndex(resolvedTimezone);
	const streak = currentStreak ?? 0;
	const weekdayLabels = useMemo(() => {
		const formatter = new Intl.DateTimeFormat(
			i18n.resolvedLanguage || i18n.language || "en",
			{
				weekday: "narrow",
			},
		);

		return WEEKDAY_REFERENCE_DATES.map((date) => formatter.format(date));
	}, [i18n.language, i18n.resolvedLanguage]);
	const completedDays = useMemo(() => {
		const weekDates = getWeekDates(resolvedTimezone);
		const activeSet = new Set(activityDates);
		return WEEK_DAY_KEYS.filter((_, i) => activeSet.has(weekDates[i]));
	}, [activityDates, resolvedTimezone]);
	return (
		<div
			className="hidden overflow-hidden rounded-3xl bg-white p-2.5 md:block"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<div className="mb-2.5 flex gap-2 pl-1.5 font-medium">
				<div className="relative flex items-center gap-1.5">
					<h3 className="flex items-center gap-2 font-lyon font-semibold text-xl">
						<Trans>{t("streak.title", { count: streak })}</Trans>
					</h3>
					<Tooltip>
						<TooltipTrigger>
							<svg
								className="size-3.5 text-neutral-300"
								aria-hidden="true"
								role="img"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 512 512"
							>
								<path
									fill="currentColor"
									d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336l24 0 0-64-24 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l48 0c13.3 0 24 10.7 24 24l0 88 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-80 0c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"
								/>
							</svg>
						</TooltipTrigger>
						<TooltipContent>
							<p>
								<Trans>{t("streak.currentStreak", { count: streak })}</Trans>
								<br />
								<Trans>
									{t("streak.longestStreak", { count: longestStreak })}
								</Trans>
							</p>
						</TooltipContent>
					</Tooltip>
					{/* <p className="text-muted-foreground text-sm">
						Time to start your first lesson!
					</p> */}
				</div>
			</div>

			<div className="rounded-2xl border border-border/50 p-3">
				<div className="flex items-center justify-between">
					{WEEK_DAY_KEYS.map((dayKey, index) => {
						const isToday = index === todayIndex;
						const isCompleted = completedDays.includes(dayKey);

						return (
							<div key={dayKey} className="flex flex-col items-center gap-2">
								<span className="font-medium text-neutral-500 text-xs">
									{weekdayLabels[index]}
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
											<svg
												aria-hidden="true"
												focusable="false"
												data-prefix="far"
												data-icon="fire"
												className="size-4 text-amber-600"
												role="img"
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 448 512"
											>
												<path
													fill="currentColor"
													d="M89.3 156.3C113 115 143.2 77 170.5 50.4c18.7 18.7 40.9 47.2 60.1 71.7c3.8 4.8 7.4 9.5 10.9 13.9c4.6 5.8 11.7 9.2 19.1 9.1s14.4-3.6 18.9-9.5c3.3-4.3 7.7-10.8 12.3-17.4c2.6-3.8 5.3-7.6 7.8-11.2c5.6-7.9 10.5-14.5 14.4-19.1c20 20.8 41 53 57.4 88.4c17.7 38.2 28.6 77 28.6 106.3c0 103-78.8 181.4-176 181.4c-98.3 0-176-78.4-176-181.4c0-37.5 16.2-82.4 41.3-126.2zM199.5 11.6C183.3-3.8 158-3.9 141.8 11.5c-32 30.1-67 73.6-94.1 121C20.7 179.5 0 233 0 282.6C0 410.9 98.1 512 224 512c124.6 0 224-100.9 224-229.4c0-39.1-13.9-85.2-33.1-126.5C395.7 114.6 369.8 74.9 343 49c-16.3-15.8-42-15.8-58.3-.1c-7.9 7.6-17 20-24.3 30.3l-1.1 1.6C240.6 57 218.4 29.5 199.5 11.6zM225.7 416c25.3 0 47.7-7 68.8-21c42.1-29.4 53.4-88.2 28.1-134.4c-4.5-9-16-9.6-22.5-2l-25.2 29.3c-6.6 7.6-18.5 7.4-24.7-.5c-16.5-21-46-58.5-62.8-79.8c-6.3-8-18.3-8.1-24.7-.1c-33.8 42.5-50.8 69.3-50.8 99.4C112 375.4 162.6 416 225.7 416z"
												/>
											</svg>
										)}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
