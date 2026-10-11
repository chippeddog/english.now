import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { getDeviceTimezone } from "@/lib/date";
import { queryClient, trpc } from "@/utils/trpc";

export function useDashboardData() {
	const profileQuery = useQuery(trpc.profile.get.queryOptions());
	const timezone = profileQuery.data?.timezone || getDeviceTimezone();

	const activityQuery = useQuery(
		trpc.profile.getWeeklyActivity.queryOptions({ timezone }),
	);
	const practiceTimeQuery = useQuery(
		trpc.profile.getDailyPracticeTime.queryOptions({ timezone }),
	);
	const courseQuery = useQuery(trpc.content.getCourse.queryOptions());

	const [isRefreshing, setIsRefreshing] = useState(false);
	const refresh = useCallback(async () => {
		setIsRefreshing(true);
		try {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: trpc.profile.pathKey() }),
				queryClient.invalidateQueries({ queryKey: trpc.content.pathKey() }),
				queryClient.invalidateQueries({ queryKey: trpc.practice.pathKey() }),
			]);
		} finally {
			setIsRefreshing(false);
		}
	}, []);

	return {
		profile: profileQuery.data ?? null,
		timezone,
		activityDates: activityQuery.data ?? [],
		isActivityLoading: activityQuery.isLoading,
		practiceTime: practiceTimeQuery.data ?? [],
		isPracticeTimeLoading: practiceTimeQuery.isLoading,
		course: courseQuery.data ?? null,
		isCourseLoading: courseQuery.isLoading,
		isRefreshing,
		refresh,
	};
}
