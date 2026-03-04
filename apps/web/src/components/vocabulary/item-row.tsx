import { MoreHorizontalIcon, Trash2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import MasteryIndicator from "./mastery-indicator";

export interface ItemRowProps {
	id: string;
	primaryText: string;
	secondaryText?: string | null;
	ipa?: string | null;
	audioUrl?: string | null;
	mastery: string;
	playingId: string | null;
	onPlay: (url: string, id: string) => void;
	onDelete: () => void;
	primaryClassName?: string;
}

export default function ItemRow({
	id,
	primaryText,
	secondaryText,
	ipa,
	audioUrl,
	mastery,
	playingId,
	onPlay,
	onDelete,
	primaryClassName,
}: ItemRowProps) {
	return (
		<div className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-border/50 bg-white p-2.5 px-3 text-left transition-colors hover:border-border/80 hover:shadow-xs dark:bg-slate-900">
			<div className="flex items-center gap-3">
				{audioUrl ? (
					<button
						type="button"
						onClick={() => onPlay(audioUrl, id)}
						className={cn(
							"flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-neutral-100",
							playingId === id ? "text-primary" : "text-muted-foreground",
						)}
					>
						<Volume2 className="size-4" />
					</button>
				) : null}
				<div>
					<div className="flex items-center gap-2">
						<span className={cn("truncate text-left font-semibold text-sm")}>
							{primaryText}
						</span>
						{ipa ? (
							<span className="text-muted-foreground text-xs">{ipa}</span>
						) : null}
					</div>
					{secondaryText ? (
						<p className="mt-0.5 line-clamp-1 text-muted-foreground text-sm">
							{secondaryText}
						</p>
					) : null}
				</div>
			</div>
			<div className="flex shrink-0 items-center gap-2">
				<MasteryIndicator mastery={mastery} />
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							className="size-6 hover:bg-neutral-100"
							variant="ghost"
							size="icon"
						>
							<MoreHorizontalIcon className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem variant="destructive" onClick={onDelete}>
							<Trash2 />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
