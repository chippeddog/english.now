import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { toast } from "sonner";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	CURRENT_WORKSPACE,
	WORKSPACES,
	type Workspace,
} from "@/lib/business/mock-data";

function WorkspaceMark({ workspace }: { workspace: Workspace }) {
	return (
		<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#172033] font-semibold text-[11px] text-white">
			{workspace.initials}
		</div>
	);
}

export function WorkspaceSwitcher() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border border-[rgba(23,32,51,0.08)] bg-white p-1.5 pr-2 text-left transition-colors hover:bg-[#F5F7FA]"
				>
					<WorkspaceMark workspace={CURRENT_WORKSPACE} />
					<div className="min-w-0 flex-1">
						<div className="truncate font-medium text-[#172033] text-sm">
							{CURRENT_WORKSPACE.name}
						</div>
						<div className="truncate text-[#5B6478] text-xs">
							{CURRENT_WORKSPACE.plan} plan
						</div>
					</div>
					<ChevronsUpDown className="size-4 shrink-0 text-[#5B6478]" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-60">
				<DropdownMenuLabel className="font-normal text-[#5B6478] text-xs">
					Workspaces
				</DropdownMenuLabel>
				{WORKSPACES.map((workspace) => (
					<DropdownMenuItem
						key={workspace.id}
						className="gap-2.5"
						onSelect={() => {
							if (workspace.id !== CURRENT_WORKSPACE.id) {
								toast.info("Switching workspaces is coming soon");
							}
						}}
					>
						<WorkspaceMark workspace={workspace} />
						<div className="min-w-0 flex-1">
							<div className="truncate text-sm">{workspace.name}</div>
							<div className="truncate text-[#5B6478] text-xs">
								{workspace.domain}
							</div>
						</div>
						{workspace.id === CURRENT_WORKSPACE.id ? (
							<Check className="size-4 text-[#172033]" />
						) : null}
					</DropdownMenuItem>
				))}
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="gap-2.5"
					onSelect={() => toast.info("Creating workspaces is coming soon")}
				>
					<div className="flex size-8 items-center justify-center rounded-md border border-[rgba(23,32,51,0.14)] border-dashed">
						<Plus className="size-4" />
					</div>
					Create workspace
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
