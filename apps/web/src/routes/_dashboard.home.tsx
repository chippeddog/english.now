import { Trans, useTranslation } from "@english.now/i18n";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import Lessons from "@/components/dashboard/lessons";
import DailyPracticeTime from "@/components/dashboard/practice-time";
import Streak from "@/components/dashboard/streak";
import TodaysActivities from "@/components/dashboard/todays-activites";
import { useTRPC } from "@/utils/trpc";
import UpgradeSuccessOverlay from "../components/dashboard/upgrade-success-overlay";

export const Route = createFileRoute("/_dashboard/home")({
	validateSearch: (search: Record<string, unknown>): { paddle?: boolean } => ({
		paddle:
			search.paddle === true || search.paddle === "true" ? true : undefined,
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { t } = useTranslation("app");
	const { session } = Route.useRouteContext();
	const { paddle } = Route.useSearch();
	const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(Boolean(paddle));
	const { data: profile } = useQuery(trpc.profile.get.queryOptions());
	const timezone =
		profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
	const { data: activityDates, isLoading: isActivityDatesLoading } = useQuery(
		trpc.profile.getWeeklyActivity.queryOptions({ timezone }),
	);
	const { data: practiceTimeData, isLoading: isPracticeTimeLoading } = useQuery(
		trpc.profile.getDailyPracticeTime.queryOptions({ timezone }),
	);
	const { data: courseData, isLoading: isCourseLoading } = useQuery(
		trpc.content.getCourse.queryOptions(),
	);
	const firstName = session?.user.name?.split(" ")[0] || "Learner";

	useEffect(() => {
		setShowUpgradeSuccess(Boolean(paddle));
	}, [paddle]);

	useEffect(() => {
		if (!paddle) return;

		void queryClient.invalidateQueries({
			queryKey: trpc.profile.get.queryKey(),
		});
		void queryClient.invalidateQueries({
			queryKey: trpc.profile.getSubscription.queryKey(),
		});

		const timeoutId = window.setTimeout(() => {
			setShowUpgradeSuccess(false);
			navigate({ to: "/home", replace: true });
		}, 4500);

		return () => window.clearTimeout(timeoutId);
	}, [navigate, paddle, queryClient, trpc]);

	return (
		<>
			<UpgradeSuccessOverlay
				open={showUpgradeSuccess}
				onClose={() => {
					setShowUpgradeSuccess(false);
					navigate({ to: "/home", replace: true });
				}}
			/>
			<div className="container relative z-10 mx-auto max-w-5xl px-4 py-6 pt-8">
				<div className="mb-8 flex flex-col gap-1">
					<div className="flex items-center gap-3">
						<h1 className="font-bold font-lyon text-3xl tracking-tight">
							<Trans>{t("home.welcomeBack", { firstName })}</Trans>
						</h1>
					</div>
					<p className="text-muted-foreground">{t("home.subtitle")}</p>
				</div>
				<div className="flex flex-col gap-5 sm:flex-row sm:items-stretch">
					<div className="w-full space-y-6 sm:w-2/3">
						<TodaysActivities />
					</div>
					<div className="flex w-full flex-col space-y-5 sm:min-h-0 sm:w-1/3">
						<Streak
							currentStreak={profile?.currentStreak ?? 0}
							longestStreak={profile?.longestStreak ?? 0}
							timezone={profile?.timezone ?? null}
							activityDates={activityDates ?? []}
							isLoading={isActivityDatesLoading}
						/>
						<div className="sm:flex sm:min-h-0 sm:flex-1 sm:flex-col">
							<Lessons
								courseData={courseData ?? null}
								isLoading={isCourseLoading}
							/>
						</div>
						<DailyPracticeTime
							practiceData={practiceTimeData ?? []}
							dailyGoal={profile?.dailyGoal ?? 5}
							timezone={timezone}
							isLoading={isPracticeTimeLoading}
						/>
					</div>
				</div>
			</div>
		</>
	);
}
