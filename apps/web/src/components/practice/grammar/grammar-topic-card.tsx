import { CheckCircleIcon, ClockIcon } from "lucide-react";
import type { TopicListItem } from "@/components/practice/grammar-route-shared";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function GrammarTopicCardSkeleton({
	skeletonKey,
}: {
	skeletonKey: string;
}) {
	return (
		<div
			className="overflow-hidden rounded-2xl border border-border/50 bg-white"
			data-skeleton={skeletonKey}
		>
			<div className="space-y-2 p-4">
				<Skeleton className="h-5 w-3/4 rounded-md" />
				<Skeleton className="h-3 w-full rounded-md" />
				<Skeleton className="h-3 w-4/5 rounded-md" />
				<Skeleton className="mt-3 h-5 w-24 rounded-full" />
			</div>
		</div>
	);
}

export function GrammarTopicCard({
	topic,
	isRecommended,
	onOpen,
}: {
	topic: TopicListItem;
	isRecommended: boolean;
	onOpen: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onOpen}
			className={cn(
				"group hover:-translate-y-0.5 flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-white text-left transition-all",
				topic.status === "in_progress" && "border-amber-200 bg-amber-50/50",
			)}
		>
			<div className="relative">
				{isRecommended ? (
					<span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 font-medium text-[11px] text-slate-800 shadow-sm">
						Recommended
					</span>
				) : null}
				{topic.status === "completed" ? (
					<div className="absolute top-3 right-3 flex size-6 items-center justify-center rounded-full border border-amber-400 bg-amber-200 text-amber-600">
						<CheckCircleIcon className="size-3.5" />
					</div>
				) : topic.status === "in_progress" ? (
					<div className="absolute top-3 right-3 flex size-6 items-center justify-center rounded-full border border-amber-400 bg-amber-200 text-amber-600">
						<ClockIcon className="size-3.5" />
					</div>
				) : null}
			</div>
			<div className="flex flex-1 flex-col gap-2 p-4">
				<h3
					className={cn(
						"line-clamp-2 font-semibold text-sm text-zinc-900",
						topic.status === "in_progress" && "text-amber-700",
					)}
				>
					{topic.title}
				</h3>
				<div className="mt-auto flex items-center justify-between pt-2">
					<span
						className={cn(
							"inline-flex items-center font-medium text-neutral-700 text-xs italic",
							topic.status === "in_progress" && "text-amber-700",
						)}
					>
						{topic.estimatedMinutes} min
					</span>
				</div>
			</div>
		</button>
	);
}
