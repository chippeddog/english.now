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

const mockWeekData = [
	{ day: "Mon", date: 16, seconds: 0, isToday: false },
	{ day: "Tue", date: 17, seconds: 0, isToday: false },
	{ day: "Wed", date: 18, seconds: 53, isToday: false },
	{ day: "Thu", date: 19, seconds: 0, isToday: false },
	{ day: "Fri", date: 20, seconds: 0, isToday: true },
	{ day: "Sat", date: 21, seconds: 0, isToday: false },
	{ day: "Sun", date: 22, seconds: 0, isToday: false },
];

const chartConfig = {
	minutes: {
		label: "Duration",
		color: "hsl(var(--muted-foreground) / 0.6)",
	},
} as const;

function formatDuration(seconds: number): string {
	if (seconds < 60) return `${seconds}s`;
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export default function DailyPracticeTime() {
	const committedMinutes = 5; // User's daily goal from onboarding
	const committedSeconds = committedMinutes * 60;
	// Add minutes for chart Y-axis
	const chartData = mockWeekData.map((d) => ({
		...d,
		minutes: Math.round((d.seconds / 60) * 10) / 10, // Display as minutes
	}));

	return (
		<div
			className="overflow-hidden rounded-3xl bg-white p-2.5"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<div className="mt-1 mb-2 flex flex-col gap-0.5 pl-1.5">
				<div className="font-bold font-lyon text-xl">Daily speaking time</div>
				{/* <p className="text-muted-foreground text-sm">
					Try to speak for at least {committedMinutes} minutes each day.
				</p> */}
			</div>

			<div className="w-full rounded-xl border border-border/50 p-2.5">
				<ChartContainer
					config={chartConfig}
					className="aspect-auto h-[138px] w-full self-stretch"
				>
					<BarChart
						data={chartData}
						margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
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
							domain={[0, committedMinutes]}
							width={0}
						/>
						<Tooltip
							content={
								<ChartTooltipContent
									formatter={(value) => (
										<span className="font-medium font-mono tabular-nums">
											{formatDuration((value as number) * 60)}
										</span>
									)}
									labelFormatter={(label) => label}
								/>
							}
							cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
						/>
						<ReferenceLine
							y={committedMinutes}
							stroke="rgb(251 146 60)"
							strokeDasharray="4 4"
							strokeWidth={1}
							label={{
								value: `${committedMinutes} min`,
								position: "bottom",
								fill: "rgb(234 88 12)",
								fontSize: 12,
								fontWeight: 500,
							}}
						/>
						<Bar
							dataKey="minutes"
							fill="hsl(var(--muted-foreground) / 0.4)"
							radius={[4, 4, 0, 0]}
							maxBarSize={32}
						/>
					</BarChart>
				</ChartContainer>
				<div className="flex justify-between rounded-xl bg-neutral-50 p-0.5">
					{mockWeekData.map((day) => (
						<button
							type="button"
							key={day.day}
							className={cn(
								"flex flex-col items-center rounded-xl p-2 transition-colors",
								day.isToday ? "bg-white shadow-sm" : "hover:bg-white/50",
							)}
						>
							<span className="text-muted-foreground text-xs">{day.day}</span>
							<span
								className={cn(
									"font-semibold",
									day.isToday ? "text-neutral-900" : "text-neutral-600",
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
											: "bg-orange-400",
									)}
								/>
							)}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
