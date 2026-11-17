import { useMemo } from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { DailyActivity } from "@/lib/business/mock-data";

const LIME_STROKE = "#65A30D";
const LIME_FILL = "#A3E635";
const GRADIENT_ID = "business-activity-gradient";

const chartConfig = {
	minutes: { label: "Practice minutes", color: LIME_STROKE },
	activeLearners: { label: "Active learners", color: "#5B6478" },
} as const;

type ChartPoint = DailyActivity & { label: string };

export function ActivityChart({ data }: { data: readonly DailyActivity[] }) {
	const points = useMemo<ChartPoint[]>(() => {
		const formatter = new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
		});
		const today = new Date();
		return data.map((item) => {
			const date = new Date(today);
			date.setDate(today.getDate() - item.daysAgo);
			return { ...item, label: formatter.format(date) };
		});
	}, [data]);

	const total = points.reduce((sum, item) => sum + item.minutes, 0);
	const tickInterval = Math.max(0, Math.ceil(points.length / 6) - 1);

	return (
		<div className="rounded-2xl border border-[rgba(23,32,51,0.08)] bg-white p-5">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h2 className="font-semibold text-[#172033] text-[15px]">
						Practice activity
					</h2>
					<p className="mt-0.5 text-[#5B6478] text-[13px]">
						Minutes your team spent practicing each day
					</p>
				</div>
				<div className="text-right">
					<div className="font-semibold text-[#172033] text-lg tabular-nums">
						{Math.round(total / 60).toLocaleString("en-US")} h
					</div>
					<div className="text-[#5B6478] text-xs">in this period</div>
				</div>
			</div>

			<ChartContainer
				config={chartConfig}
				className="mt-4 aspect-auto h-[220px] w-full"
			>
				<AreaChart
					data={points}
					margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
				>
					<defs>
						<linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor={LIME_FILL} stopOpacity={0.35} />
							<stop offset="100%" stopColor={LIME_FILL} stopOpacity={0} />
						</linearGradient>
					</defs>
					<CartesianGrid vertical={false} stroke="rgba(23,32,51,0.06)" />
					<XAxis
						dataKey="label"
						tickLine={false}
						axisLine={false}
						interval={tickInterval}
						tickMargin={8}
						tick={{ fontSize: 11, fill: "#5B6478" }}
					/>
					<YAxis hide />
					<Tooltip
						cursor={{ stroke: "rgba(23,32,51,0.14)", strokeDasharray: "3 3" }}
						content={
							<ChartTooltipContent
								indicator="line"
								labelFormatter={(_, payload) =>
									(payload?.[0]?.payload as ChartPoint | undefined)?.label ?? ""
								}
								formatter={(_, __, item) => {
									const point = item.payload as ChartPoint;
									return (
										<div className="flex w-full flex-col gap-1">
											<div className="flex items-center justify-between gap-4">
												<span className="text-muted-foreground">Practice</span>
												<span className="font-medium tabular-nums">
													{point.minutes} min
												</span>
											</div>
											<div className="flex items-center justify-between gap-4">
												<span className="text-muted-foreground">
													Active learners
												</span>
												<span className="font-medium tabular-nums">
													{point.activeLearners}
												</span>
											</div>
										</div>
									);
								}}
							/>
						}
					/>
					<Area
						type="monotone"
						dataKey="minutes"
						stroke={LIME_STROKE}
						strokeWidth={2}
						fill={`url(#${GRADIENT_ID})`}
						isAnimationActive={false}
						activeDot={{
							r: 4,
							fill: LIME_STROKE,
							stroke: "#FFFFFF",
							strokeWidth: 2,
						}}
					/>
				</AreaChart>
			</ChartContainer>
		</div>
	);
}
