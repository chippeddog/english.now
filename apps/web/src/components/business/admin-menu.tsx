import { Link } from "@tanstack/react-router";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CURRENT_WORKSPACE, MEMBERS } from "@/lib/business/mock-data";
import { MemberAvatar } from "./member-avatar";

const CURRENT_ADMIN =
	MEMBERS.find((member) => member.role === "admin") ?? MEMBERS[0];

export function AdminMenu() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					aria-label="Account menu"
					className="cursor-pointer rounded-full outline-none ring-offset-2 transition focus-visible:ring-2 focus-visible:ring-[#172033]"
				>
					<MemberAvatar name={CURRENT_ADMIN.name} size="md" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-60">
				<DropdownMenuLabel className="font-normal">
					<div className="font-medium text-[#172033] text-sm">
						{CURRENT_ADMIN.name}
					</div>
					<div className="truncate text-[#5B6478] text-xs">
						{CURRENT_ADMIN.email}
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem disabled>
					Admin of {CURRENT_WORKSPACE.name}
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link to="/home">Open learner app</Link>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
