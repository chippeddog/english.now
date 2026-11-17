import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MEMBER_TILE_CLASS } from "./member-card";

export function InviteMemberCard({ onClick }: { onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(MEMBER_TILE_CLASS, "group gap-3")}
		>
			<span className="flex size-12 items-center justify-center rounded-full bg-[#F5F7FA] text-[#172033] transition-colors group-hover:bg-[#EDF0F5]">
				<Plus className="size-5" />
			</span>
			<span className="font-medium text-[#172033] text-sm">Invite members</span>
		</button>
	);
}
