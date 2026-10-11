import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Card, CardHeader } from "@/components/ui/card";
import { buildWeekData, computeTrend, formatMinutes } from "@/lib/date";

const CHART_HEIGHT = 120;

const TREND = {
	up: { label: "Trending up", icon: "trending-up" as const, color: "#65a30d" },
	down: {
		label: "Trending down",
		icon: "trending-down" as const,
		color: "#f97316",
	},
	flat: { label: "Steady", icon: "remove" as const, color: "#737373" },
};

export function PracticeTimeCard({
	practiceData,
	dailyGoal,
	timezone,
	isLoading,
}: {
	practiceData: { date: string; seconds: number }[];
	dailyGoal: number;
	timezone: string;
	isLoading: boolean;
}) {
	const goalMinutes = dailyGoal || 5;
	const week = useMemo(
		() => buildWeekData(practiceData, timezone),
		[practiceData, timezone],
	);
	const totalMinutes = week.reduce((sum, day) => sum + day.minutes, 0);
	const todayMinutes = week.find((day) => day.isToday)?.minutes ?? 0;
	const chartMax = Math.max(
		goalMinutes * 1.4,
		Math.ceil(Math.max(...week.map((d) => d.minutes)) * 1.2),
	);
	const trend = TREND[computeTrend(week)];
	const goalOffset = (goalMinutes / chartMax) * CHART_HEIGHT;

	return (
		<Card>
			<CardHeader title="Daily speaking time" />

			{isLoading ? (
				<View
					className="items-center justify-center rounded-xl border border-neutral-100 bg-neutral-50"
					style={{ height: CHART_HEIGHT + 60 }}
				>
					<ActivityIndicator color="#a3a3a3" />
				</View>
			) : (
				<>
					<View className="mb-4 flex-row items-end justify-between px-1">
						<View>
							<Text className="font-semibold text-neutral-900 text-xl">
								{formatMinutes(totalMinutes)}
							</Text>
							<Text className="text-[11px] text-neutral-500 italic">
								this week
							</Text>
						</View>
						<View className="items-end gap-1">
							<View className="flex-row items-center gap-1">
								<Ionicons name={trend.icon} size={12} color={trend.color} />
								<Text
									className="font-medium text-[11px] italic"
									style={{ color: trend.color }}
								>
									{trend.label}
								</Text>
							</View>
							<Text className="text-[11px] text-neutral-500">
								Today {formatMinutes(todayMinutes)} / {goalMinutes} min goal
							</Text>
						</View>
					</View>

					<View style={{ height: CHART_HEIGHT }} className="relative">
						<View
							className="absolute right-0 left-0 border-neutral-400 border-t border-dashed"
							style={{ bottom: goalOffset }}
						/>
						<View className="h-full flex-row items-end justify-between px-1">
							{week.map((day) => {
								const height =
									day.minutes > 0
										? Math.max(4, (day.minutes / chartMax) * CHART_HEIGHT)
										: 4;
								return (
									<View key={day.label} className="flex-1 items-center">
										<View
											className={`w-6 rounded-md ${
												day.minutes >= goalMinutes
													? "bg-lime-500"
													: day.minutes > 0
														? "bg-lime-300"
														: "bg-neutral-100"
											} ${day.isToday ? "border-2 border-lime-700" : ""}`}
											style={{ height }}
										/>
									</View>
								);
							})}
						</View>
					</View>
					<View className="mt-2 flex-row justify-between px-1">
						{week.map((day) => (
							<Text
								key={day.label}
								className={`flex-1 text-center text-[11px] ${day.isToday ? "font-semibold text-neutral-900" : "text-neutral-500"}`}
							>
								{day.label.charAt(0)}
							</Text>
						))}
					</View>
				</>
			)}
		</Card>
	);
}
