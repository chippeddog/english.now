import { EyeIcon, MoreHorizontalIcon, PlayIcon, TrashIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import ProgressCircle from "@/components/practice/progress-circle";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeDate } from "@/utils/date";

export type PracticeSessionItem = {
	id: string;
	type: "conversation" | "pronunciation" | "grammar";
	title: string;
	status: string;
	score: number | null;
	createdAt: Date | string;
};

type SessionRowProps = {
	session: PracticeSessionItem;
	onOpen: (session: PracticeSessionItem) => void;
	onDelete: (session: PracticeSessionItem) => void;
};

export default function SessionRow({
	session,
	onOpen,
	onDelete,
}: SessionRowProps) {
	const { t } = useTranslation("app");

	const statusLabel =
		session.status === "completed"
			? t("practice.completed")
			: session.status === "active"
				? t("practice.inProgress")
				: null;

	const sessionTypeLabel =
		session.type === "conversation"
			? t("practice.conversation")
			: session.type === "grammar"
				? t("practice.grammar")
				: t("practice.pronunciation");

	return (
		<div className="group flex w-full items-center gap-3 rounded-2xl border border-border/50 bg-white p-2.5 pr-3 text-left transition-colors hover:border-border/80 hover:shadow-xs">
			<button
				type="button"
				onClick={() => onOpen(session)}
				className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3"
			>
				<div className="flex items-center gap-2">
					<ProgressCircle progress={session.score ?? 0} />
					<div className="flex min-w-0 flex-1 flex-col items-start">
						<span className="truncate text-left font-medium text-sm">
							{session.title}
						</span>
						<span className="text-muted-foreground text-xs capitalize italic">
							{sessionTypeLabel}
							{statusLabel ? ` · ${statusLabel}` : ""}
						</span>
					</div>
				</div>

				<span className="shrink-0 text-muted-foreground text-xs italic">
					{formatRelativeDate(new Date(session.createdAt))}
				</span>
			</button>

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
					{session.status === "completed" && (
						<DropdownMenuItem onClick={() => onOpen(session)}>
							<EyeIcon />
							{t("practice.view")}
						</DropdownMenuItem>
					)}
					{session.status === "active" && (
						<DropdownMenuItem onClick={() => onOpen(session)}>
							<PlayIcon />
							{t("practice.continue")}
						</DropdownMenuItem>
					)}
					<DropdownMenuItem
						variant="destructive"
						onClick={() => onDelete(session)}
					>
						<TrashIcon />
						{t("practice.delete")}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
