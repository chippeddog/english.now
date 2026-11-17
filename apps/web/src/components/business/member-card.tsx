import { Badge } from "@/components/ui/badge";
import { getTeamName, type Member } from "@/lib/business/mock-data";
import { cn } from "@/lib/utils";
import { MemberAvatar } from "./member-avatar";

export const MEMBER_TILE_CLASS =
	"flex h-[184px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-[rgba(23,32,51,0.1)] bg-white px-4 text-center transition-[border-color,box-shadow] hover:border-[rgba(23,32,51,0.18)] hover:shadow-[0_8px_24px_-12px_rgba(23,32,51,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#172033]";

export function MemberCard({
	member,
	onSelect,
}: {
	member: Member;
	onSelect: (member: Member) => void;
}) {
	const isInvited = member.status === "invited";
	const isDeactivated = member.status === "deactivated";

	return (
		<button
			type="button"
			onClick={() => onSelect(member)}
			className={cn(MEMBER_TILE_CLASS, isDeactivated && "opacity-60")}
		>
			<MemberAvatar name={member.name} size="lg" muted={isInvited} />
			<div className="mt-3 flex max-w-full items-center gap-1.5">
				<span className="truncate font-semibold text-[#172033] text-sm">
					{member.name}
				</span>
				{member.role === "admin" ? (
					<span className="shrink-0 rounded-md bg-[#F5F7FA] px-1.5 py-0.5 text-[#5B6478] text-[10px] leading-none">
						Admin
					</span>
				) : null}
			</div>
			<div className="mt-0.5 max-w-full truncate text-[#5B6478] text-xs">
				{member.title}, {getTeamName(member.teamId)}
			</div>
			<div className="mt-2.5 flex items-center gap-2 text-xs">
				{isInvited ? (
					<span className="rounded-full border border-[rgba(23,32,51,0.14)] border-dashed px-2 py-0.5 text-[#5B6478]">
						Invite pending
					</span>
				) : isDeactivated ? (
					<span className="rounded-full bg-[#F5F7FA] px-2 py-0.5 text-[#5B6478]">
						Deactivated
					</span>
				) : (
					<>
						{member.level ? (
							<Badge
								variant={member.level}
								className="rounded-md px-1.5 py-0 font-medium"
							>
								{member.level}
							</Badge>
						) : null}
						<span className="text-[#5B6478]">
							<span className="font-semibold text-[#172033] tabular-nums">
								{member.minutesThisWeek}
							</span>{" "}
							min this week
						</span>
					</>
				)}
			</div>
		</button>
	);
}
