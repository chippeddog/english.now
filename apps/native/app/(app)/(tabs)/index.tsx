import { View } from "react-native";
import { LearningPathCard } from "@/components/home/learning-path-card";
import { PracticeTimeCard } from "@/components/home/practice-time-card";
import { StreakCard } from "@/components/home/streak-card";
import { TodaysPractice } from "@/components/home/todays-practice";
import { TabScreen } from "@/components/tab-screen";
import { ScreenTitle } from "@/components/ui/section-header";
import { authClient } from "@/lib/auth-client";
import { useDashboardData } from "@/lib/use-dashboard-data";

export default function HomeScreen() {
	const { data: session } = authClient.useSession();
	const dashboard = useDashboardData();
	const firstName = session?.user.name?.split(" ")[0] || "Learner";

	return (
		<TabScreen
			refreshing={dashboard.isRefreshing}
			onRefresh={dashboard.refresh}
		>
			<ScreenTitle
				title={`Welcome back, ${firstName}`}
				subtitle="Keep up the great work! You're making excellent progress."
			/>
			<View className="gap-5">
				<TodaysPractice />
				<StreakCard
					currentStreak={dashboard.profile?.currentStreak ?? 0}
					timezone={dashboard.timezone}
					activityDates={dashboard.activityDates}
					isLoading={dashboard.isActivityLoading}
				/>
				<LearningPathCard
					courseData={dashboard.course}
					isLoading={dashboard.isCourseLoading}
				/>
				<PracticeTimeCard
					practiceData={dashboard.practiceTime}
					dailyGoal={dashboard.profile?.dailyGoal ?? 5}
					timezone={dashboard.timezone}
					isLoading={dashboard.isPracticeTimeLoading}
				/>
			</View>
		</TabScreen>
	);
}
