import { useTranslation } from "@english.now/i18n";
import { Loader } from "lucide-react";
import { useMemo } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ReferenceLine,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type DayData = {
	dayKey: DayKey;
	dayLabel: string;
	date: number;
	seconds: number;
	isToday: boolean;
};

type PracticeXAxisTickProps = {
	x?: number;
	y?: number;
	payload?: {
		value: string;
		index?: number;
	};
	committedSeconds: number;
	weekData: DayData[];
};

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

function buildWeekData(
	practiceData: { date: string; seconds: number }[],
	timezone: string,
	language: string,
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

		week.push({
			dayKey: DAY_KEYS[i],
			dayLabel: localizedWeekdayFormatter.format(date),
			date: dayNum,
			seconds: secondsMap.get(ymd) ?? 0,
			isToday: ymd === todayYMD,
		});
	}

	return week;
}

const chartConfig = {
	minutes: {
		label: "Duration",
		color: "hsl(var(--muted-foreground) / 0.6)",
	},
} as const;

const LOGO_BAR_GRADIENT_ID = "practice-time-logo-bar-gradient";
const FIVE_MINUTES_IN_SECONDS = 5 * 60;

function roundUpToStep(value: number, step: number) {
	return Math.ceil(value / step) * step;
}

function getGridStepSeconds(maxSeconds: number) {
	const maxMinutes = Math.ceil(maxSeconds / 60);

	if (maxMinutes <= 20) {
		return FIVE_MINUTES_IN_SECONDS;
	}

	if (maxMinutes <= 45) {
		return 10 * 60;
	}

	if (maxMinutes <= 90) {
		return 15 * 60;
	}

	return 30 * 60;
}

function getGridTicks(maxSeconds: number, stepSeconds: number) {
	const tickCount = Math.max(1, Math.ceil(maxSeconds / stepSeconds));
	return Array.from({ length: tickCount }, (_, index) => index * stepSeconds);
}

function formatDuration(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = Math.round(seconds % 60);
	if (mins === 0 && secs === 0) return "0 min";
	if (mins === 0) return `${secs} sec`;
	return secs > 0 ? `${mins} min ${secs} sec` : `${mins} min`;
}

function PracticeXAxisTick({
	x = 0,
	y = 0,
	payload,
	committedSeconds,
	weekData,
}: PracticeXAxisTickProps) {
	if (!payload) {
		return null;
	}

	const day =
		(payload.index !== undefined ? weekData[payload.index] : undefined) ??
		weekData.find((item) => item.dayKey === payload.value);

	if (!day) {
		return null;
	}

	const indicatorColor =
		day.seconds >= committedSeconds
			? "#84CC16"
			: day.seconds > 0
				? "#F59E0B"
				: "#F5F5F5";

	return (
		<g transform={`translate(${x},${y})`}>
			{/* {day.isToday ? (
				<rect
					x={-18}
					y={6}
					width={36}
					height={44}
					rx={12}
					fill="#FFFFFF"
					stroke="rgba(0, 0, 0, 0.05)"
				/>
			) : null} */}
			<text
				x={0}
				y={22}
				textAnchor="middle"
				fontSize={12}
				fill="var(--muted-foreground)"
			>
				{day.dayLabel}
			</text>
			<text
				x={0}
				y={40}
				textAnchor="middle"
				fontSize={12}
				fontWeight={600}
				fill={day.isToday ? "#171717" : "#737373"}
			>
				{day.date}
			</text>
			{indicatorColor ? (
				<circle cx={0} cy={48} r={3} fill={indicatorColor} />
			) : null}
		</g>
	);
}

function PracticeTimeSkeleton() {
	return (
		<div className="w-full rounded-xl pt-0">
			<div className="h-[190px] w-full rounded-xl border border-border/40 bg-neutral-50/70">
				<div className="flex h-full items-center justify-center text-neutral-400">
					<Loader className="size-5 animate-spin" />
				</div>
			</div>
		</div>
	);
}

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
	const committedMinutes = dailyGoal || 5;
	const committedSeconds = committedMinutes * 60;
	const weekData = useMemo(
		() =>
			buildWeekData(
				practiceData,
				timezone,
				i18n.resolvedLanguage || i18n.language || "en",
			),
		[practiceData, timezone, i18n.language, i18n.resolvedLanguage],
	);
	const maxPracticeSeconds = useMemo(
		() => Math.max(0, ...weekData.map((day) => day.seconds)),
		[weekData],
	);
	const gridStepSeconds = useMemo(
		() => getGridStepSeconds(Math.max(committedSeconds, maxPracticeSeconds)),
		[committedSeconds, maxPracticeSeconds],
	);
	const chartMaxSeconds = useMemo(
		() =>
			Math.max(
				gridStepSeconds * 2,
				roundUpToStep(
					Math.max(committedSeconds, maxPracticeSeconds) + gridStepSeconds,
					gridStepSeconds,
				),
			),
		[committedSeconds, maxPracticeSeconds, gridStepSeconds],
	);
	const gridTicks = useMemo(
		() => getGridTicks(chartMaxSeconds, gridStepSeconds),
		[chartMaxSeconds, gridStepSeconds],
	);
	const gridLineTicks = useMemo(
		() => gridTicks.filter((tick) => tick !== committedSeconds),
		[gridTicks, committedSeconds],
	);

	return (
		<div
			className="overflow-hidden rounded-3xl bg-white p-2.5"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<div className="mt-1 mb-2.5 flex flex-col pl-1.5">
				<div className="font-bold font-lyon text-xl">
					{t("practiceTime.title")}
				</div>
			</div>

			{isLoading ? (
				<PracticeTimeSkeleton />
			) : (
				<div className="w-full rounded-xl border border-border/50 p-2.5 pt-0">
					<ChartContainer
						config={chartConfig}
						className="aspect-auto h-[190px] w-full self-stretch"
					>
						<BarChart
							accessibilityLayer
							data={weekData}
							margin={{ top: 14, right: 6, left: 2, bottom: 6 }}
						>
							<defs>
								<radialGradient
									id={LOGO_BAR_GRADIENT_ID}
									cx="50%"
									cy="0%"
									r="100%"
									fx="50%"
									fy="0%"
								>
									<stop offset="0%" stopColor="#EFFF9B" />
									<stop offset="60%" stopColor="#D8FF76" />
									<stop offset="100%" stopColor="#C6F64D" />
								</radialGradient>
							</defs>
							<CartesianGrid
								vertical={false}
								stroke="var(--border)"
								strokeWidth={1}
								horizontalCoordinatesGenerator={({ offset }) => {
									if (
										offset?.top === undefined ||
										offset.height === undefined ||
										chartMaxSeconds <= 0
									) {
										return [];
									}

									const { top, height } = offset;

									return gridLineTicks.map((tick) => {
										const progress = tick / chartMaxSeconds;
										return top + height - height * progress;
									});
								}}
							/>
							<XAxis
								dataKey="dayKey"
								tick={(props) => (
									<PracticeXAxisTick
										{...props}
										committedSeconds={committedSeconds}
										weekData={weekData}
									/>
								)}
								tickLine={false}
								axisLine={false}
								interval={0}
								height={58}
							/>
							<YAxis
								tick={false}
								tickLine={false}
								axisLine={false}
								domain={[0, chartMaxSeconds]}
								ticks={gridLineTicks}
								width={0}
							/>
							<Tooltip
								content={
									<ChartTooltipContent
										formatter={(value) => (
											<span className="font-medium font-mono tabular-nums">
												{formatDuration(value as number)}
											</span>
										)}
										labelFormatter={(label) => label}
									/>
								}
								cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
							/>
							<ReferenceLine
								y={committedSeconds}
								stroke="#5EA500"
								strokeDasharray="4 4"
								strokeWidth={1}
								label={{
									value: `${committedMinutes} min`,
									position: "insideTopRight",
									fill: "#497D00",
									fontSize: 11,
									fontWeight: 500,
								}}
							/>
							<Bar
								dataKey="seconds"
								fill={`url(#${LOGO_BAR_GRADIENT_ID})`}
								stroke="#C6F64D"
								strokeWidth={1}
								radius={[4, 4, 0, 0]}
								maxBarSize={32}
							/>
						</BarChart>
					</ChartContainer>
				</div>
			)}
		</div>
	);
}
