import { ChevronDown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
	LessonTreeLesson,
	LessonTreeUnit,
	UnitStatus,
} from "@/types/lesson";
import { LessonRow } from "./lesson-row";

function UnitProgressCircle({
	progress,
	status,
}: {
	progress: number;
	status: UnitStatus;
}) {
	const circumference = 2 * Math.PI * 18;
	const dashOffset = circumference - (progress / 100) * circumference;

	if (status === "locked") {
		return (
			<div className="flex size-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
				<Lock className="size-4" />
			</div>
		);
	}

	return (
		<div className="relative flex size-12 items-center justify-center">
			<svg className="size-12" viewBox="0 0 44 44" aria-hidden="true">
				<title>Unit progress</title>
				<circle
					cx="22"
					cy="22"
					r="18"
					fill="none"
					stroke="currentColor"
					strokeWidth="3"
					className="text-neutral-100"
				/>
				<circle
					cx="22"
					cy="22"
					r="18"
					fill="none"
					stroke="currentColor"
					strokeWidth="3"
					strokeLinecap="round"
					strokeDasharray={`${circumference}`}
					strokeDashoffset={dashOffset}
					transform="rotate(-90 22 22)"
					className={cn(
						"text-orange-500",
						status === "completed" && "text-lime-500",
					)}
				/>
			</svg>
			<span
				className={cn(
					"absolute font-bold text-[10px]",
					status === "completed" && "text-lime-600",
				)}
			>
				{progress}%
			</span>
		</div>
	);
}

interface UnitCardProps {
	unit: LessonTreeUnit;
	onSelectLesson: (lesson: LessonTreeLesson) => void;
	isCollapsed?: boolean;
	onToggleCollapse?: () => void;
}

export function UnitCard({
	unit,
	onSelectLesson,
	isCollapsed,
	onToggleCollapse,
}: UnitCardProps) {
	const isLocked = unit.status === "locked";
	const isCompleted = unit.status === "completed";
	const canCollapse = isCompleted;

	return (
		<div
			className={cn(
				"overflow-hidden rounded-3xl",
				isLocked ? "bg-neutral-50" : "bg-white",
			)}
			style={
				isLocked
					? {
							boxShadow:
								"rgba(162, 166, 171, 0.15) 0px 0px 0px 0px inset, rgba(162, 166, 171, 0.15) 0px 0px 6px 2px inset",
						}
					: {
							boxShadow:
								"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
						}
			}
		>
			<div className="p-4">
				<div className="relative flex flex-col gap-4">
					{!isCollapsed && unit.lessons.length > 0 && (
						<div
							className="-translate-x-1/2 absolute top-12 bottom-0 left-6 w-px border-neutral-200 border-l border-dashed"
							aria-hidden="true"
						/>
					)}
					<div className="flex min-h-12 items-center gap-3">
						<div className="relative z-10 flex w-12 shrink-0 justify-center">
							<UnitProgressCircle
								progress={isLocked ? 0 : unit.progress}
								status={unit.status}
							/>
						</div>
						<button
							type="button"
							onClick={canCollapse ? onToggleCollapse : undefined}
							className={cn(
								"flex min-w-0 flex-1 items-center gap-3 text-left",
								canCollapse && "cursor-pointer",
							)}
						>
							<div className="flex min-w-0 flex-1 flex-col">
								<h3
									className={cn(
										"font-semibold",
										isLocked && "text-muted-foreground",
									)}
								>
									{unit.title}
								</h3>
								{isLocked && unit.unlockMessage && (
									<p className="text-muted-foreground text-xs">
										{unit.unlockMessage}
									</p>
								)}
							</div>
							{canCollapse && (
								<ChevronDown
									className={cn(
										"size-5 shrink-0 text-muted-foreground transition-transform duration-200",
										isCollapsed && "-rotate-90",
									)}
								/>
							)}
						</button>
					</div>
					{!isCollapsed &&
						unit.lessons.map((lesson) => (
							<LessonRow
								key={lesson.id}
								lesson={lesson}
								onSelect={onSelectLesson}
							/>
						))}
				</div>
			</div>
		</div>
	);
}
