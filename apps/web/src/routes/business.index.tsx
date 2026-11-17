import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Flame, UserPlus } from "lucide-react";
import { useState } from "react";
import { ActivityChart } from "@/components/business/activity-chart";
import { CefrDistribution } from "@/components/business/cefr-distribution";
import { InviteDialog } from "@/components/business/invite-dialog";
import { MemberAvatar } from "@/components/business/member-avatar";
import { FilterPill, PageHeader } from "@/components/business/page-header";
import { StatCard } from "@/components/business/stat-card";
import { Button } from "@/components/ui/button";
import {
	getActivityForRange,
	getLevelDistribution,
	getOverviewStats,
	getTeamName,
	getTopLearners,
	OVERVIEW_RANGES,
	type OverviewRange,
} from "@/lib/business/mock-data";
import { cn } from "@/lib/utils";
import { createTitle } from "@/utils/title";

export const Route = createFileRoute("/business/")({
	validateSearch: (
		search: Record<string, unknown>,
	): { range?: OverviewRange } => {
		const range = OVERVIEW_RANGES.find((item) => item.value === search.range);
		return { range: range?.value };
	},
	component: OverviewPage,
	head: () => ({
		meta: [{ title: createTitle("Overview", "English Now Business") }],
	}),
});

const CHECKLIST = [
	{
		id: "invite",
		title: "Invite your team",
		description: "Add the people who will practice English.",
		done: true,
	},
	{
		id: "program",
		title: "Choose a learning program",
		description: "Role-based tracks for sales, support and more.",
		done: false,
	},
	{
		id: "sso",
		title: "Connect single sign-on",
		description: "Let members join with Google Workspace or Okta.",
		done: false,
	},
] as const;

function OverviewPage() {
	const { range = "30d" } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const [inviteOpen, setInviteOpen] = useState(false);

	const stats = getOverviewStats(range);
	const activity = getActivityForRange(range);
	const topLearners = getTopLearners(5);
	const seatsPercent = Math.round((stats.seatsUsed / stats.seatsTotal) * 100);
	const completedSteps = CHECKLIST.filter((step) => step.done).length;

	return (
		<div className="flex flex-col gap-8">
			<PageHeader
				title="Overview"
				description="How your team is practicing English"
				actions={
					<Button
						onClick={() => setInviteOpen(true)}
						className="h-9 rounded-full bg-[#172033] px-4 text-white hover:bg-[#172033]/90"
					>
						<UserPlus />
						Invite members
					</Button>
				}
			/>

			<div className="flex flex-wrap gap-2">
				{OVERVIEW_RANGES.map((item) => (
					<FilterPill
						key={item.value}
						active={range === item.value}
						onClick={() =>
							navigate({
								search: {
									range: item.value === "30d" ? undefined : item.value,
								},
								replace: true,
							})
						}
					>
						{item.label}
					</FilterPill>
				))}
			</div>

			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<StatCard
					label="Seats used"
					value={
						<>
							{stats.seatsUsed}
							<span className="font-normal text-[#5B6478] text-base">
								/{stats.seatsTotal}
							</span>
						</>
					}
				>
					<div className="h-1.5 overflow-hidden rounded-full bg-[#F5F7FA]">
						<div
							className="h-full rounded-full bg-[#172033]"
							style={{ width: `${seatsPercent}%` }}
						/>
					</div>
				</StatCard>
				<StatCard
					label="Active learners"
					value={stats.activeLearners}
					delta={
						stats.activeLearnersDelta !== 0
							? {
									value: `${stats.activeLearnersDelta > 0 ? "+" : ""}${stats.activeLearnersDelta}`,
									positive: stats.activeLearnersDelta > 0,
								}
							: null
					}
					hint="Peak on a single day"
				/>
				<StatCard
					label="Practice minutes"
					value={stats.practiceMinutes.toLocaleString("en-US")}
					delta={
						stats.practiceMinutesDelta !== 0
							? {
									value: `${Math.abs(stats.practiceMinutesDelta)}%`,
									positive: stats.practiceMinutesDelta > 0,
								}
							: null
					}
					hint="Compared with the previous period"
				/>
				<StatCard
					label="Average level gain"
					value={`+${stats.averageLevelGain}`}
					hint="CEFR steps since joining"
				/>
			</div>

			<ActivityChart data={activity} />

			<div className="grid gap-4 md:grid-cols-2">
				<CefrDistribution data={getLevelDistribution()} />

				<div className="rounded-2xl border border-[rgba(23,32,51,0.08)] bg-white p-5">
					<div className="flex items-start justify-between gap-4">
						<div>
							<h2 className="font-semibold text-[#172033] text-[15px]">
								Top learners
							</h2>
							<p className="mt-0.5 text-[#5B6478] text-[13px]">
								Most practice this week
							</p>
						</div>
						<Link
							to="/business/members"
							search={{ sort: "active" }}
							className="font-medium text-[#172033] text-[13px] hover:underline"
						>
							View all
						</Link>
					</div>
					<ul className="mt-4 flex flex-col">
						{topLearners.map((member, index) => (
							<li
								key={member.id}
								className="flex items-center gap-3 border-[rgba(23,32,51,0.06)] border-t py-2.5 first:border-t-0"
							>
								<span className="w-3 text-[#5B6478] text-xs tabular-nums">
									{index + 1}
								</span>
								<MemberAvatar name={member.name} size="sm" />
								<div className="min-w-0 flex-1">
									<div className="truncate font-medium text-[#172033] text-sm">
										{member.name}
									</div>
									<div className="truncate text-[#5B6478] text-xs">
										{getTeamName(member.teamId)}
									</div>
								</div>
								{member.streakDays > 0 ? (
									<span className="flex items-center gap-0.5 text-orange-500 text-xs tabular-nums">
										<Flame className="size-3.5" />
										{member.streakDays}
									</span>
								) : null}
								<span className="w-14 text-right font-medium text-[#172033] text-sm tabular-nums">
									{member.minutesThisWeek} min
								</span>
							</li>
						))}
					</ul>
				</div>
			</div>

			<div className="rounded-2xl border border-[rgba(23,32,51,0.08)] bg-white p-5">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h2 className="font-semibold text-[#172033] text-[15px]">
							Getting started
						</h2>
						<p className="mt-0.5 text-[#5B6478] text-[13px]">
							{completedSteps} of {CHECKLIST.length} steps done
						</p>
					</div>
					<div className="flex gap-1">
						{CHECKLIST.map((step) => (
							<span
								key={step.id}
								className={cn(
									"h-1.5 w-6 rounded-full",
									step.done ? "bg-now-gradient" : "bg-[#F5F7FA]",
								)}
							/>
						))}
					</div>
				</div>
				<ul className="mt-4 flex flex-col gap-2">
					{CHECKLIST.map((step) => (
						<li
							key={step.id}
							className="flex items-center gap-3 rounded-xl bg-[#F5F7FA]/70 px-3.5 py-3"
						>
							<span
								className={cn(
									"flex size-6 shrink-0 items-center justify-center rounded-full",
									step.done
										? "border border-[#C6F64D] bg-now-gradient text-now-deep"
										: "border border-[rgba(23,32,51,0.14)] border-dashed bg-white",
								)}
							>
								{step.done ? (
									<Check className="size-3.5" strokeWidth={3} />
								) : null}
							</span>
							<div className="min-w-0 flex-1">
								<div
									className={cn(
										"font-medium text-sm",
										step.done ? "text-[#5B6478]" : "text-[#172033]",
									)}
								>
									{step.title}
								</div>
								<div className="text-[#5B6478] text-xs">{step.description}</div>
							</div>
							{step.id === "invite" ? (
								<Button
									variant="outline"
									size="sm"
									className="rounded-full"
									onClick={() => setInviteOpen(true)}
								>
									Invite more
								</Button>
							) : (
								<span className="rounded-md bg-white px-2 py-1 text-[#5B6478] text-[11px] leading-none">
									Soon
								</span>
							)}
						</li>
					))}
				</ul>
			</div>

			<InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
		</div>
	);
}
