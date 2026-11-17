import { ArrowRight, Flame, Mail, UserMinus, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerTitle,
} from "@/components/ui/drawer";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	type CefrLevel,
	formatDaysAgo,
	getTeamName,
	type Member,
	SESSION_KIND_META,
	TEAMS,
} from "@/lib/business/mock-data";
import { MemberAvatar } from "./member-avatar";

function LevelBadge({ level }: { level: CefrLevel | null }) {
	if (!level) {
		return <span className="text-[#5B6478] text-sm">Not assessed</span>;
	}
	return (
		<Badge variant={level} className="rounded-md px-1.5 font-medium">
			{level}
		</Badge>
	);
}

function WeeklyMinutes({ minutes }: { minutes: readonly number[] }) {
	const max = Math.max(1, ...minutes);
	return (
		<div className="flex h-16 items-end gap-1.5">
			{minutes.map((value, index) => {
				const isCurrent = index === minutes.length - 1;
				return (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: fixed-length weekly series
						key={index}
						title={`${value} min`}
						className={
							isCurrent
								? "flex-1 rounded-sm bg-now-gradient"
								: "flex-1 rounded-sm bg-[#E6EAF0]"
						}
						style={{ height: `${Math.max(6, (value / max) * 100)}%` }}
					/>
				);
			})}
		</div>
	);
}

export function MemberDrawer({
	member,
	onOpenChange,
}: {
	member: Member | null;
	onOpenChange: (open: boolean) => void;
}) {
	return (
		<Drawer
			direction="right"
			open={member !== null}
			onOpenChange={onOpenChange}
		>
			<DrawerContent className="w-full overflow-y-auto data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-md">
				{member ? <MemberDetails member={member} /> : null}
			</DrawerContent>
		</Drawer>
	);
}

function MemberDetails({ member }: { member: Member }) {
	const isInvited = member.status === "invited";
	const isDeactivated = member.status === "deactivated";
	const weekTotal = member.weeklyMinutes.reduce((sum, value) => sum + value, 0);

	return (
		<>
			<div className="flex items-center justify-between px-5 pt-5">
				<span className="text-[#5B6478] text-xs">Member</span>
				<DrawerClose asChild>
					<button
						type="button"
						aria-label="Close"
						className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-[#F5F7FA] text-[#5B6478] hover:bg-[#EDF0F5]"
					>
						<X className="size-4" />
					</button>
				</DrawerClose>
			</div>

			<div className="flex flex-col items-center px-5 pt-2 pb-6 text-center">
				<MemberAvatar name={member.name} size="xl" muted={isInvited} />
				<DrawerTitle className="mt-3 text-[#172033] text-lg">
					{member.name}
				</DrawerTitle>
				<DrawerDescription className="mt-0.5">
					{member.title}, {getTeamName(member.teamId)}
				</DrawerDescription>
				<div className="mt-1 text-[#5B6478] text-xs">{member.email}</div>
			</div>

			<div className="flex flex-col gap-4 px-5">
				<div className="grid grid-cols-3 divide-x divide-[rgba(23,32,51,0.08)] rounded-2xl border border-[rgba(23,32,51,0.08)]">
					<div className="p-3">
						<div className="text-[#5B6478] text-xs">Started</div>
						<div className="mt-1.5">
							<LevelBadge level={member.startLevel} />
						</div>
					</div>
					<div className="p-3">
						<div className="text-[#5B6478] text-xs">Now</div>
						<div className="mt-1.5">
							<LevelBadge level={member.level} />
						</div>
					</div>
					<div className="p-3">
						<div className="text-[#5B6478] text-xs">Target</div>
						<div className="mt-1.5">
							<LevelBadge level={member.targetLevel} />
						</div>
					</div>
				</div>

				{isInvited ? (
					<div className="rounded-2xl border border-[rgba(23,32,51,0.14)] border-dashed p-4 text-center">
						<div className="font-medium text-[#172033] text-sm">
							Invite sent {formatDaysAgo(member.joinedDaysAgo).toLowerCase()}
						</div>
						<p className="mt-1 text-[#5B6478] text-xs">
							Their progress will show up here after they join.
						</p>
					</div>
				) : (
					<>
						<div className="rounded-2xl border border-[rgba(23,32,51,0.08)] p-4">
							<div className="flex items-start justify-between gap-3">
								<div>
									<div className="font-medium text-[#172033] text-sm">
										Weekly practice
									</div>
									<div className="text-[#5B6478] text-xs">Last 8 weeks</div>
								</div>
								<div className="text-right">
									<div className="font-semibold text-[#172033] text-sm tabular-nums">
										{weekTotal} min
									</div>
									{member.streakDays > 0 ? (
										<div className="flex items-center justify-end gap-0.5 text-orange-500 text-xs">
											<Flame className="size-3" />
											{member.streakDays} day streak
										</div>
									) : null}
								</div>
							</div>
							<div className="mt-4">
								<WeeklyMinutes minutes={member.weeklyMinutes} />
							</div>
						</div>

						<div className="rounded-2xl border border-[rgba(23,32,51,0.08)] p-4">
							<div className="flex items-center justify-between">
								<div className="font-medium text-[#172033] text-sm">
									Recent sessions
								</div>
								<div className="text-[#5B6478] text-xs">
									Last active{" "}
									{formatDaysAgo(member.lastActiveDaysAgo).toLowerCase()}
								</div>
							</div>
							{member.recentSessions.length > 0 ? (
								<ul className="mt-3 flex flex-col">
									{member.recentSessions.map((session) => {
										const meta = SESSION_KIND_META[session.kind];
										return (
											<li
												key={session.id}
												className="flex items-center gap-3 border-[rgba(23,32,51,0.06)] border-t py-2.5 first:border-t-0"
											>
												<span
													className="flex size-8 shrink-0 items-center justify-center rounded-md font-semibold text-[#172033] text-[11px]"
													style={{ backgroundColor: meta.tint }}
												>
													{meta.label.slice(0, 2)}
												</span>
												<div className="min-w-0 flex-1">
													<div className="truncate text-[#172033] text-sm">
														{session.title}
													</div>
													<div className="text-[#5B6478] text-xs">
														{meta.label}, {session.minutes} min,{" "}
														{formatDaysAgo(session.daysAgo).toLowerCase()}
													</div>
												</div>
												{session.score !== null ? (
													<span className="text-[#172033] text-xs tabular-nums">
														{session.score}%
													</span>
												) : null}
											</li>
										);
									})}
								</ul>
							) : (
								<p className="mt-3 text-[#5B6478] text-sm">No sessions yet.</p>
							)}
						</div>
					</>
				)}
			</div>

			<DrawerFooter className="mt-6 flex-row flex-wrap gap-2 border-[rgba(23,32,51,0.08)] border-t p-5">
				{isInvited ? (
					<Button
						variant="outline"
						size="sm"
						className="rounded-full"
						onClick={() => toast.success(`Invite resent to ${member.email}`)}
					>
						<Mail />
						Resend invite
					</Button>
				) : null}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm" className="rounded-full">
							<ArrowRight />
							Change team
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuLabel className="font-normal text-[#5B6478] text-xs">
							Move to
						</DropdownMenuLabel>
						{TEAMS.filter((team) => team.id !== member.teamId).map((team) => (
							<DropdownMenuItem
								key={team.id}
								onSelect={() =>
									toast.success(`${member.name} moved to ${team.name}`)
								}
							>
								{team.name}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
				{isDeactivated ? (
					<Button
						variant="outline"
						size="sm"
						className="rounded-full"
						onClick={() => toast.success(`${member.name} reactivated`)}
					>
						<UserPlus />
						Reactivate
					</Button>
				) : (
					<Button
						variant="ghost"
						size="sm"
						className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
						onClick={() =>
							toast.success(
								isInvited
									? `Invite for ${member.name} revoked`
									: `${member.name} deactivated`,
							)
						}
					>
						<UserMinus />
						{isInvited ? "Revoke invite" : "Deactivate"}
					</Button>
				)}
			</DrawerFooter>
		</>
	);
}
