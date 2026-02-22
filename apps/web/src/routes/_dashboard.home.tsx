import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import Lessons from "@/components/dashboard/lessons";
import DailyPracticeTime from "@/components/dashboard/practice-time";
import Streak from "@/components/dashboard/streak";
import TodaysActivities from "@/components/dashboard/todays-activites";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_dashboard/home")({
	component: RouteComponent,
});

function RouteComponent() {
	const trpc = useTRPC();
	const { session } = Route.useRouteContext();
	const { data: profile } = useQuery(trpc.profile.get.queryOptions());
	const timezone =
		profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
	const { data: activityDates, isLoading: isActivityDatesLoading } = useQuery(
		trpc.profile.getWeeklyActivity.queryOptions({ timezone }),
	);
	const firstName = session?.user.name?.split(" ")[0] || "Learner";

	return (
		<div className="container relative z-10 mx-auto max-w-5xl px-4 py-6 pt-8">
			<div className="mb-8 flex flex-col gap-1">
				<div className="flex items-center gap-3">
					<h1 className="font-bold font-lyon text-3xl tracking-tight">
						Welcome back, {firstName}
					</h1>
				</div>
				<p className="text-muted-foreground">
					Keep up the great work! You're making excellent progress.
				</p>
			</div>
			<div className="grid gap-5 lg:grid-cols-3">
				<div className="space-y-6 lg:col-span-2">
					<TodaysActivities />
				</div>
				<div className="space-y-5">
					<Streak
						currentStreak={profile?.currentStreak ?? 0}
						longestStreak={profile?.longestStreak ?? 0}
						timezone={profile?.timezone ?? null}
						activityDates={activityDates ?? []}
						isLoading={isActivityDatesLoading}
					/>
					<Lessons />
					<DailyPracticeTime />
				</div>
			</div>
		</div>
	);
}
