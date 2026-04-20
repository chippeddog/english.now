import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ItemEmptyStateProps {
	title: string;
	description: string;
	actionLabel: string;
	onAction: () => void;
}

export default function ItemEmptyState({
	title,
	description,
	actionLabel,
	onAction,
}: ItemEmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white/50 py-10 pb-20 dark:bg-slate-900/50">
			<div className="flex w-32 items-center justify-center">
				<img src="/icons/empty.png" alt="Empty state" />
			</div>
			<div className="mb-6 flex flex-col items-center justify-center gap-3">
				<h3 className="font-semibold text-lg">{title}</h3>
				<p className="max-w-sm text-center text-muted-foreground">
					{description}
				</p>
			</div>
			<Button
				onClick={onAction}
				className="gap-1.5 rounded-xl border border-neutral-200 bg-linear-to-b from-neutral-50 to-neutral-100 text-neutral-700 italic"
			>
				<Plus className="size-4" />
				{actionLabel}
			</Button>
		</div>
	);
}
