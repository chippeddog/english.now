import { useTranslation } from "@english.now/i18n";
import { Loader, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import {
	Area,
	CartesianGrid,
	ComposedChart,
	Line,
	ReferenceLine,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type DayData = {
	dayKey: DayKey;
	dayLabel: string;
	dayShortLabel: string;
	date: number;
	seconds: number;
	minutes: number;
	goalMinutes: number;
	isToday: boolean;
	isFuture: boolean;
};

type Trend = "up" | "down" | "flat";

const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const ENGLISH_DAY_LABELS: Record<DayKey, string> = {
	mon: "Mon",
	tue: "Tue",
	wed: "Wed",
	thu: "Thu",
	fri: "Fri",
	sat: "Sat",
	sun: "Sun",
};

const LIME_STROKE = "#65A30D";
const LIME_FILL_TOP = "#A3E635";
const DASHED_STROKE = "#A3A3A3";
const AREA_GRADIENT_ID = "practice-time-area-gradient";

function buildWeekData(
	practiceData: { date: string; seconds: number }[],
	timezone: string,
	language: string,
	goalMinutes: number,
): DayData[] {
	const now = new Date();
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		weekday: "short",
		day: "numeric",
		year: "numeric",
		month: "2-digit",
	});
	const localizedWeekdayFormatter = new Intl.DateTimeFormat(language, {
		timeZone: timezone,
		weekday: "short",
	});
	const localizedNarrowFormatter = new Intl.DateTimeFormat(language, {
		timeZone: timezone,
		weekday: "narrow",
	});

	const todayParts = formatter.formatToParts(now);
	const todayWeekday = todayParts.find((p) => p.type === "weekday")?.value;

	const todayYMD = new Intl.DateTimeFormat("en-CA", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(now);

	const todayIdx = DAY_KEYS.findIndex(
		(dayKey) => ENGLISH_DAY_LABELS[dayKey] === (todayWeekday ?? "Mon"),
	);

	const secondsMap = new Map<string, number>();
	for (const d of practiceData) {
		secondsMap.set(d.date, d.seconds);
	}

	const week: DayData[] = [];
	for (let i = 0; i < 7; i++) {
		const offset = i - todayIdx;
		const date = new Date(now);
		date.setDate(date.getDate() + offset);

		const ymd = new Intl.DateTimeFormat("en-CA", {
			timeZone: timezone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(date);

		const parts = formatter.formatToParts(date);
		const dayNum = Number(parts.find((p) => p.type === "day")?.value ?? 0);
		const seconds = secondsMap.get(ymd) ?? 0;

		week.push({
			dayKey: DAY_KEYS[i],
			dayLabel: localizedWeekdayFormatter.format(date),
			dayShortLabel: localizedNarrowFormatter.format(date),
			date: dayNum,
			seconds,
			minutes: seconds / 60,
			goalMinutes,
			isToday: ymd === todayYMD,
			isFuture: offset > 0,
		});
	}

	return week;
}

function computeTrend(weekData: DayData[]): Trend {
	const played = weekData.filter((d) => !d.isFuture);
	if (played.length < 2) return "flat";

	const mid = Math.floor(played.length / 2);
	const first = played.slice(0, mid);
	const second = played.slice(mid);

	const avg = (list: DayData[]) =>
		list.reduce((sum, d) => sum + d.minutes, 0) / Math.max(1, list.length);

	const diff = avg(second) - avg(first);
	if (Math.abs(diff) < 0.5) return "flat";
	return diff > 0 ? "up" : "down";
}

function formatMinutes(minutes: number, t: (key: string) => string): string {
	if (minutes <= 0) return `0 ${t("practiceTime.minShort")}`;
	if (minutes < 1) {
		const secs = Math.max(1, Math.round(minutes * 60));
		return `${secs} ${t("practiceTime.secShort")}`;
	}
	return `${Math.round(minutes)} ${t("practiceTime.minShort")}`;
}

function PracticeTimeSkeleton() {
	return (
		<div className="w-full rounded-xl pt-0">
			<div className="h-[220px] w-full rounded-xl border border-border/40 bg-neutral-50/70">
				<div className="flex h-full items-center justify-center text-neutral-400">
					<Loader className="size-5 animate-spin" />
				</div>
			</div>
		</div>
	);
}

const chartConfig = {
	minutes: {
		label: "Practice",
		color: LIME_STROKE,
	},
	goalMinutes: {
		label: "Goal",
		color: DASHED_STROKE,
	},
} as const;

export default function DailyPracticeTime({
	practiceData,
	dailyGoal,
	timezone,
	isLoading = false,
}: {
	practiceData: { date: string; seconds: number }[];
	dailyGoal: number;
	timezone: string;
	isLoading?: boolean;
}) {
	const { i18n, t } = useTranslation("app");
	const goalMinutes = dailyGoal || 5;

	const weekData = useMemo(
		() =>
			buildWeekData(
				practiceData,
				timezone,
				i18n.resolvedLanguage || i18n.language || "en",
				goalMinutes,
			),
		[practiceData, timezone, i18n.language, i18n.resolvedLanguage, goalMinutes],
	);

	const totalWeekMinutes = useMemo(
		() => weekData.reduce((sum, d) => sum + d.minutes, 0),
		[weekData],
	);
	const maxMinutes = useMemo(
		() => Math.max(goalMinutes, ...weekData.map((d) => d.minutes)),
		[weekData, goalMinutes],
	);
	const chartMaxMinutes = useMemo(
		() => Math.max(goalMinutes * 1.4, Math.ceil(maxMinutes * 1.2)),
		[maxMinutes, goalMinutes],
	);

	const trend = useMemo(() => computeTrend(weekData), [weekData]);
	const trendLabel =
		trend === "up"
			? t("practiceTime.trendingUp")
			: trend === "down"
				? t("practiceTime.trendingDown")
				: t("practiceTime.steady");
	const TrendIcon =
		trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
	const trendColor =
		trend === "up"
			? "text-lime-600"
			: trend === "down"
				? "text-orange-500"
				: "text-neutral-500";

	return (
		<div
			className="relative overflow-hidden rounded-3xl bg-white p-4"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<div className="mb-3 flex items-start justify-between gap-3">
				<div>
					<div className="flex items-center gap-1.5">
						{/* <TrendingUp className="size-4 text-lime-600" strokeWidth={2.5} /> */}
						<div className="font-semibold text-sm">
							{t("practiceTime.title")}
						</div>
					</div>
					{/* <div className="mt-0.5 text-neutral-500 text-xs">
						{t("practiceTime.subtitle")}
					</div> */}
				</div>
			</div>

			{isLoading ? (
				<PracticeTimeSkeleton />
			) : (
				<>
					<div className="absolute top-11 left-5 flex items-end justify-between">
						<div>
							<div className="font-semibold text-neutral-900 text-xl tabular-nums">
								{formatMinutes(totalWeekMinutes, t)}
							</div>
							<div className="text-[11px] text-neutral-500 italic tracking-wide">
								{t("practiceTime.thisWeek")}
							</div>
						</div>
						{/* <div
							className={cn(
								"flex items-center gap-1 font-medium text-xs",
								trendColor,
							)}
						>
							<TrendIcon className="size-3.5" strokeWidth={2.5} />
							{trendLabel}
						</div> */}
					</div>

					<ChartContainer
						config={chartConfig}
						className="aspect-auto h-[170px] w-full self-stretch"
					>
						<ComposedChart
							accessibilityLayer
							data={weekData}
							margin={{ top: 12, right: 8, left: 4, bottom: 4 }}
						>
							<defs>
								<linearGradient
									id={AREA_GRADIENT_ID}
									x1="0"
									y1="0"
									x2="0"
									y2="1"
								>
									<stop
										offset="0%"
										stopColor={LIME_FILL_TOP}
										stopOpacity={0.35}
									/>
									<stop
										offset="100%"
										stopColor={LIME_FILL_TOP}
										stopOpacity={0}
									/>
								</linearGradient>
							</defs>
							<CartesianGrid vertical={false} stroke="transparent" />
							<XAxis
								dataKey="dayShortLabel"
								tickLine={false}
								axisLine={false}
								interval={0}
								tick={{
									fontSize: 11,
									fill: "#737373",
								}}
								tickMargin={6}
							/>
							<YAxis
								hide
								domain={[0, chartMaxMinutes]}
								allowDataOverflow={false}
							/>
							<Tooltip
								content={
									<ChartTooltipContent
										indicator="line"
										labelFormatter={(_, payload) => {
											const day = payload?.[0]?.payload as DayData | undefined;
											if (!day) return "";
											return `${day.dayLabel} ${day.date}`;
										}}
										formatter={(value, name) => (
											<div className="flex w-full items-center justify-between gap-3">
												<span className="text-muted-foreground capitalize">
													{name === "minutes"
														? t("practiceTime.practice")
														: t("practiceTime.goal")}
												</span>
												<span className="font-medium font-mono tabular-nums">
													{formatMinutes(value as number, t)}
												</span>
											</div>
										)}
									/>
								}
								cursor={{
									stroke: "#E5E5E5",
									strokeWidth: 1,
									strokeDasharray: "3 3",
								}}
							/>
							<ReferenceLine
								y={goalMinutes}
								stroke="transparent"
								ifOverflow="extendDomain"
							/>
							<Area
								type="monotone"
								dataKey="minutes"
								stroke="transparent"
								fill={`url(#${AREA_GRADIENT_ID})`}
								isAnimationActive={false}
								activeDot={false}
							/>
							<Line
								type="monotone"
								dataKey="goalMinutes"
								stroke={DASHED_STROKE}
								strokeWidth={1.5}
								strokeDasharray="4 4"
								dot={false}
								activeDot={false}
								isAnimationActive={false}
							/>
							<Line
								type="monotone"
								dataKey="minutes"
								stroke={LIME_STROKE}
								strokeWidth={2.5}
								strokeLinecap="round"
								strokeLinejoin="round"
								dot={(props) => {
									const { cx, cy, payload, index } = props as {
										cx: number;
										cy: number;
										payload: DayData;
										index: number;
									};
									if (!payload.isToday) {
										return <g key={`dot-${index}`} />;
									}
									return (
										<g key={`dot-${index}`}>
											<circle
												cx={cx}
												cy={cy}
												r={5}
												fill="#FFFFFF"
												stroke={LIME_STROKE}
												strokeWidth={2.5}
											/>
										</g>
									);
								}}
								activeDot={{
									r: 4,
									fill: LIME_STROKE,
									stroke: "#FFFFFF",
									strokeWidth: 2,
								}}
								isAnimationActive={false}
							/>
						</ComposedChart>
					</ChartContainer>

					<div className="mt-2 flex items-center gap-5 text-[11px] text-neutral-500">
						<div className="flex items-center gap-1.5">
							<span
								className="inline-block h-[2px] w-4 rounded-full"
								style={{ backgroundColor: LIME_STROKE }}
							/>
							<span>{t("practiceTime.practice")}</span>
						</div>
						<div className="flex items-center gap-1.5">
							<span
								className="inline-block h-[2px] w-4"
								style={{
									backgroundImage: `linear-gradient(to right, ${DASHED_STROKE} 50%, transparent 50%)`,
									backgroundSize: "4px 2px",
									backgroundRepeat: "repeat-x",
								}}
							/>
							<span>{t("practiceTime.goal")}</span>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
