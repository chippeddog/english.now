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
				<div>
					<h3 className="flex items-center gap-2 font-lyon font-semibold text-xl">
						<Trans>{t("streak.title", { count: streak })}</Trans>
						<Tooltip>
							<TooltipTrigger>
								<InfoIcon className="size-4 text-neutral-400" strokeWidth={2} />
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
					</h3>
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
			</div>
		</div>
	);
}
