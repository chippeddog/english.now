import type { TFunction } from "i18next";
import {
	MoreHorizontalIcon,
	Pencil,
	Trash2,
	Volume1,
	Volume2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import DeleteItemDialog from "./delete-item-dialog";
import MasteryIndicator from "./mastery-indicator";

export interface ItemRowProps {
	id: string;
	primaryText: string;
	secondaryText?: string | null;
	ipa?: string | null;
	showIpa?: boolean;
	audioUrl?: string | null;
	mastery: string;
	playingId: string | null;
	onPlay: (url: string, id: string) => void;
	onDelete: () => void;
	onEdit?: () => void;
	primaryClassName?: string;
	nextReviewAt?: string | null;
	isDue?: boolean;
}

function getReviewLabel(
	t: TFunction<"app">,
	nextReviewAt?: string | null,
	isDue?: boolean,
) {
	if (isDue) return t("vocabulary.itemRow.dueNow");
	if (!nextReviewAt) return null;

	const dueAt = new Date(nextReviewAt);
	const diffMs = dueAt.getTime() - Date.now();

	if (diffMs <= 0) return t("vocabulary.itemRow.dueNow");

	const diffHours = Math.ceil(diffMs / (60 * 60 * 1000));
	if (diffHours < 24) {
		return t("vocabulary.itemRow.inHours", { count: diffHours });
	}

	const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
	if (diffDays === 1) return t("vocabulary.itemRow.tomorrow");
	return t("vocabulary.itemRow.inDays", { count: diffDays });
}

export default function ItemRow({
	id,
	primaryText,
	secondaryText,
	ipa,
	showIpa = true,
	audioUrl,
	mastery,
	playingId,
	onPlay,
	onDelete,
	onEdit,
	primaryClassName,
	nextReviewAt,
	isDue,
}: ItemRowProps) {
	const { t } = useTranslation("app");
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const reviewLabel = getReviewLabel(t, nextReviewAt, isDue);
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
						{showIpa && ipa ? (
							<span className="text-muted-foreground text-xs">{ipa}</span>
						) : null}
					</div>
					{secondaryText ? (
						<p className="line-clamp-1 text-muted-foreground text-sm italic">
							{secondaryText}
						</p>
					) : null}
				</div>
			</div>
			<div className="flex shrink-0 items-center gap-2">
				<div className="flex items-center gap-1">
					{reviewLabel ? (
						<span className="text-muted-foreground text-xs italic">
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
						{onEdit ? (
							<DropdownMenuItem onClick={onEdit}>
								<Pencil />
								{t("vocabulary.itemRow.edit")}
							</DropdownMenuItem>
						) : null}
						<DropdownMenuItem
							variant="destructive"
							onClick={() => setShowDeleteDialog(true)}
						>
							<Trash2 />
							{t("vocabulary.itemRow.delete")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<DeleteItemDialog
				open={showDeleteDialog}
				onOpenChange={setShowDeleteDialog}
				onConfirm={onDelete}
			/>
		</div>
	);
}
