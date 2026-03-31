import { MoreHorizontalIcon, Trash2, Volume1, Volume2 } from "lucide-react";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
	nextReviewAt?: string | null;
	isDue?: boolean;
}

function getReviewLabel(nextReviewAt?: string | null, isDue?: boolean) {
	if (isDue) return "Due now";
	if (!nextReviewAt) return null;

	const dueAt = new Date(nextReviewAt);
	const diffMs = dueAt.getTime() - Date.now();

	if (diffMs <= 0) return "Due now";

	const diffHours = Math.ceil(diffMs / (60 * 60 * 1000));
	if (diffHours < 24) {
		return `In ${diffHours}h`;
	}

	const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
	if (diffDays === 1) return "Tomorrow";
	return `In ${diffDays}d`;
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
	nextReviewAt,
	isDue,
}: ItemRowProps) {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const reviewLabel = getReviewLabel(nextReviewAt, isDue);
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
						{playingId === id ? (
							<Volume2 className="size-4" />
						) : (
							<Volume1 className="size-4" />
						)}
					</button>
				) : null}
				<div>
					<div className="flex items-center gap-2">
						<span
							className={cn(
								"truncate text-left font-semibold text-sm",
								primaryClassName,
							)}
						>
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
				<div className="flex items-center gap-1">
					{reviewLabel ? (
						<span className="text-[11px] text-muted-foreground">
							{reviewLabel}
						</span>
					) : null}
					<MasteryIndicator mastery={mastery} />
				</div>
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
						<DropdownMenuItem
							variant="destructive"
							onClick={() => setShowDeleteDialog(true)}
						>
							<Trash2 />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent className="w-sm">
					<AlertDialogHeader>
						<AlertDialogTitle>Delete item</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this item? This action cannot be
							undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={onDelete}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
