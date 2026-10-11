import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Text, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getTodayIndex, getWeekDates, WEEKDAY_SHORT } from "@/lib/date";

type StreakCardProps = {
	currentStreak: number;
	longestStreak?: number;
	timezone: string;
	activityDates: string[];
	isLoading: boolean;
	showLongest?: boolean;
};

export function StreakCard({
	currentStreak,
	longestStreak = 0,
	timezone,
	activityDates,
	isLoading,
	showLongest = false,
}: StreakCardProps) {
	const todayIndex = getTodayIndex(timezone);
	const activeDays = useMemo(() => {
		const active = new Set(activityDates);
		return getWeekDates(timezone).map((date) => active.has(date));
	}, [activityDates, timezone]);

	return (
		<Card className="p-2.5">
			<View className="mt-1 mb-3 flex-row items-end justify-between px-1.5">
				<View className="flex-row items-baseline gap-1.5">
					<Text className="font-bold text-3xl text-neutral-900">
						{currentStreak}
					</Text>
					<Text className="font-semibold text-neutral-900 text-sm">
						Day Streak
					</Text>
				</View>
				{showLongest ? (
					<Text className="text-neutral-500 text-xs">
						Longest: {longestStreak} {longestStreak === 1 ? "day" : "days"}
					</Text>
				) : null}
			</View>

			<View className="flex-row items-center justify-between rounded-2xl border border-neutral-100 p-3">
				{WEEKDAY_SHORT.map((day, index) => {
					const isCompleted = activeDays[index];
					const isToday = index === todayIndex;
					return (
						<View key={day} className="items-center gap-2">
							<Text className="font-medium text-neutral-500 text-xs">
								{day.charAt(0)}
							</Text>
							{isLoading ? (
								<Skeleton className="size-9 rounded-full" />
							) : (
								<View
									className={`size-9 items-center justify-center rounded-full ${
										isCompleted
											? "border border-amber-400 bg-amber-300"
											: isToday
												? "border border-amber-400"
												: "bg-neutral-100"
									}`}
								>
									{isCompleted ? (
										<Ionicons name="flame" size={16} color="#d97706" />
									) : null}
								</View>
							)}
						</View>
					);
				})}
			</View>
		</Card>
	);
}
