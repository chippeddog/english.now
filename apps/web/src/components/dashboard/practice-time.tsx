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
import { cn } from "@/lib/utils";

type DayData = {
	day: string;
	date: number;
	seconds: number;
	isToday: boolean;
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function buildWeekData(
	practiceData: { date: string; seconds: number }[],
	timezone: string,
): DayData[] {
	const now = new Date();
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		weekday: "short",
		day: "numeric",
		year: "numeric",
		month: "2-digit",
	});

	const todayParts = formatter.formatToParts(now);
	const todayWeekday = todayParts.find((p) => p.type === "weekday")?.value;

	const todayYMD = new Intl.DateTimeFormat("en-CA", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(now);

	const todayIdx = DAY_LABELS.indexOf(todayWeekday ?? "Mon");

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
			day: DAY_LABELS[i],
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

function formatDuration(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = Math.round(seconds % 60);
	if (mins === 0 && secs === 0) return "0 min";
	if (mins === 0) return `${secs} sec`;
	return secs > 0 ? `${mins} min ${secs} sec` : `${mins} min`;
}

export default function DailyPracticeTime({
	practiceData,
	dailyGoal,
	timezone,
}: {
	practiceData: { date: string; seconds: number }[];
	dailyGoal: number;
	timezone: string;
}) {
	const committedMinutes = dailyGoal || 5;
	const committedSeconds = committedMinutes * 60;

	const weekData = useMemo(
		() => buildWeekData(practiceData, timezone),
		[practiceData, timezone],
	);

	return (
		<div
			className="overflow-hidden rounded-3xl bg-white p-2.5"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<div className="mt-1 mb-2 flex flex-col pl-1.5">
				<div className="font-bold font-lyon text-xl">Daily Practice</div>
			</div>

			<div className="w-full rounded-xl border border-border/50 p-2.5">
				<ChartContainer
					config={chartConfig}
					className="aspect-auto h-[138px] w-full self-stretch"
				>
					<BarChart
						data={weekData}
						margin={{ top: 8, right: 2, left: 2, bottom: 0 }}
					>
						<CartesianGrid
							strokeDasharray="3 3"
							vertical={false}
							stroke="hsl(var(--border))"
						/>
						<XAxis
							dataKey="day"
							tick={false}
							tickLine={false}
							axisLine={false}
							height={0}
						/>
						<YAxis
							tick={false}
							tickLine={false}
							axisLine={false}
							domain={[0, committedSeconds]}
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
							stroke="#FF8904"
							strokeDasharray="4 4"
							strokeWidth={1}
							label={{
								value: `${committedMinutes} min`,
								position: "bottom",
								fill: "#E17100",
								fontSize: 12,
								fontWeight: 500,
							}}
						/>
						<Bar
							dataKey="seconds"
							fill="#262626"
							stroke="#262626"
							strokeWidth={1}
							radius={[4, 4, 0, 0]}
							maxBarSize={32}
						/>
					</BarChart>
				</ChartContainer>
				<div className="grid grid-cols-7 rounded-lg bg-neutral-50 px-0.5">
					{weekData.map((day) => (
						<div
							key={day.day}
							className={cn(
								"flex flex-col items-center rounded-xl p-1.5 transition-colors",
								day.isToday ? "bg-white shadow-sm" : null,
							)}
						>
							<span className="text-muted-foreground text-xs">{day.day}</span>
							<span
								className={cn(
									"font-semibold",
									day.isToday ? "text-neutral-900" : "text-neutral-500",
								)}
							>
								{day.date}
							</span>
							{day.seconds > 0 && (
								<div
									className={cn(
										"mt-0.5 size-1.5 rounded-full bg-neutral-100",
										day.seconds >= committedSeconds
											? "bg-lime-500"
											: "bg-amber-500",
									)}
								/>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
