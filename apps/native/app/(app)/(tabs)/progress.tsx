import { Text, View } from "react-native";
import { UnitStatusIcon } from "@/components/home/lesson-icons";
import { PracticeTimeCard } from "@/components/home/practice-time-card";
import { StreakCard } from "@/components/home/streak-card";
import { TabScreen } from "@/components/tab-screen";
import { Card, CardHeader } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ScreenTitle } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import type { CourseData } from "@/lib/api-types";
import { useDashboardData } from "@/lib/use-dashboard-data";

export default function ProgressScreen() {
	const dashboard = useDashboardData();

	return (
		<TabScreen
			refreshing={dashboard.isRefreshing}
			onRefresh={dashboard.refresh}
		>
			<ScreenTitle
				title="Your Progress"
				subtitle="Track your streak, practice time, and course progress."
			/>
			<View className="gap-5">
				<StreakCard
					currentStreak={dashboard.profile?.currentStreak ?? 0}
					longestStreak={dashboard.profile?.longestStreak ?? 0}
					timezone={dashboard.timezone}
					activityDates={dashboard.activityDates}
					isLoading={dashboard.isActivityLoading}
					showLongest
				/>
				<PracticeTimeCard
					practiceData={dashboard.practiceTime}
					dailyGoal={dashboard.profile?.dailyGoal ?? 5}
					timezone={dashboard.timezone}
					isLoading={dashboard.isPracticeTimeLoading}
				/>
				<CourseProgressCard
					course={dashboard.course}
					isLoading={dashboard.isCourseLoading}
				/>
			</View>
		</TabScreen>
	);
}

function CourseProgressCard({
	course,
	isLoading,
}: {
	course: CourseData | null;
	isLoading: boolean;
}) {
	return (
		<Card>
			<CardHeader
				title={course?.title ?? "Course progress"}
				right={
					course ? (
						<Text className="font-medium text-neutral-500 text-xs">
							{course.level} · {Math.round(course.progress)}%
						</Text>
					) : undefined
				}
			/>
			{isLoading ? (
				<View className="gap-3 p-1">
					<Skeleton className="h-12 rounded-2xl" />
					<Skeleton className="h-12 rounded-2xl" />
					<Skeleton className="h-12 rounded-2xl" />
				</View>
			) : !course || course.units.length === 0 ? (
				<Text className="py-6 text-center text-neutral-500 text-sm">
					No course progress yet.
				</Text>
			) : (
				<View className="gap-1">
					<ProgressBar value={course.progress} className="mx-1 mb-3" />
					{course.units.map((unit, index) => {
						const completedLessons = unit.lessons.filter(
							(lesson) => lesson.status === "completed",
						).length;
						const isLocked = unit.status === "locked";
						return (
							<View
								key={unit.id}
								className="flex-row items-center gap-3 rounded-xl px-1 py-2.5"
							>
								<UnitStatusIcon status={unit.status} />
								<View className="flex-1 gap-1.5">
									<View className="flex-row items-center justify-between gap-2">
										<Text
											className={`flex-1 font-semibold text-sm ${isLocked ? "text-neutral-400" : "text-neutral-900"}`}
											numberOfLines={1}
										>
											{index + 1}. {unit.title}
										</Text>
										<Text className="text-neutral-500 text-xs">
											{completedLessons}/{unit.lessons.length}
										</Text>
									</View>
									<ProgressBar
										value={unit.progress}
										colorClassName={
											unit.status === "completed"
												? "bg-emerald-600"
												: "bg-lime-500"
										}
									/>
								</View>
							</View>
						);
					})}
				</View>
			)}
		</Card>
	);
}
