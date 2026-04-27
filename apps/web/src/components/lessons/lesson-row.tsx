import { Check, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
	LessonStatus,
	LessonTreeLesson,
	LessonTypeValue,
} from "@/types/lesson";
import { lessonTypeConfig } from "./lesson-type-config";

function LessonStatusIcon({
	status,
	type,
}: {
	status: LessonStatus;
	type: LessonTypeValue;
}) {
	const config = lessonTypeConfig[type];

	if (status === "completed") {
		return (
			<div className="flex size-8 items-center justify-center rounded-full border border-lime-400 bg-lime-200 text-lime-600">
				<Check className="size-4" strokeWidth={2.5} />
			</div>
		);
	}

	if (status === "locked") {
		return (
			<div className="flex size-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-300">
				<Lock className="size-3.5" />
			</div>
		);
	}

	const Icon = config.icon;

	if (status === "current") {
		return (
			<div className="flex size-8 items-center justify-center rounded-full border border-amber-400 bg-amber-200 text-amber-600">
				<Icon className="size-4" />
			</div>
		);
	}

	return (
		<div className="flex size-8 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-neutral-400">
			<Icon className="size-4" />
		</div>
	);
}

interface LessonRowProps {
	lesson: LessonTreeLesson;
	onSelect: (lesson: LessonTreeLesson) => void;
}

export function LessonRow({ lesson, onSelect }: LessonRowProps) {
	const config = lessonTypeConfig[lesson.type];
	const isCurrent = lesson.status === "current";
	const isCompleted = lesson.status === "completed";
	const isLocked = lesson.status === "locked";

	return (
		<div className="flex h-12 items-center gap-3">
			<div className="relative z-10 flex w-12 shrink-0 justify-center">
				<LessonStatusIcon status={lesson.status} type={lesson.type} />
			</div>
			<button
				type="button"
				onClick={() => onSelect(lesson)}
				className={cn(
					"group flex h-full min-h-12 w-full items-center gap-3 rounded-2xl py-0 text-left transition-all",
					isLocked && "cursor-default opacity-50",
				)}
			>
				<div className="flex min-h-12 min-w-0 flex-1 flex-col justify-center py-1">
					<div className="flex items-center gap-2">
						<span
							className={cn(
								"font-medium text-sm",
								isCompleted && "text-muted-foreground",
								isLocked && "text-muted-foreground",
							)}
						>
							{lesson.title}
						</span>
					</div>
					<span className="text-muted-foreground text-xs">
						{isCurrent ? config.label : lesson.subtitle}
					</span>
				</div>

				{isCurrent && (
					<ChevronRight className="size-5 font-semibold text-muted-foreground" />
				)}
				{isCompleted && (
					<ChevronRight className="size-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
				)}
				{isLocked && <Lock className="size-3.5 text-neutral-300" />}
			</button>
		</div>
	);
}
