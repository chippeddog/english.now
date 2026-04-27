import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CefrLevel } from "@/types/lesson";

export type LevelSummary = {
	level: CefrLevel;
	enrollmentId: string | null;
	courseVersionId: string | null;
	status: "active" | "completed" | "paused" | "unavailable";
	progressPercent: number;
	totalLessons: number;
	completedLessons: number;
	isPrimary: boolean;
	requiresUpgrade: boolean;
};

interface LevelSwitcherProps {
	levels: LevelSummary[];
	selectedLevel: CefrLevel;
	onSelect: (level: LevelSummary) => void;
}

export function LevelSwitcher({
	levels,
	selectedLevel,
	onSelect,
}: LevelSwitcherProps) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			{levels.map((level) => {
				const isSelected = level.level === selectedLevel;
				const isUnavailable = level.status === "unavailable";
				const isLocked = level.requiresUpgrade;
				const isEnrolled = Boolean(level.enrollmentId);

				return (
					<button
						key={level.level}
						type="button"
						disabled={isUnavailable}
						onClick={() => onSelect(level)}
						className={cn(
							"group relative flex items-center gap-2 rounded-full border px-3 py-1.5 font-semibold text-sm transition-all",
							isSelected
								? "border-neutral-900 bg-neutral-900 text-white"
								: "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
							isUnavailable && "cursor-not-allowed opacity-40",
							!isSelected && isEnrolled && "border-neutral-300",
						)}
					>
						<span>{level.level}</span>
						{isEnrolled && (
							<span
								className={cn(
									"inline-block size-1.5 rounded-full",
									isSelected ? "bg-white" : "bg-lime-500",
								)}
								aria-hidden="true"
							/>
						)}
						{!isEnrolled && isLocked && (
							<Lock
								className={cn(
									"size-3",
									isSelected ? "text-white" : "text-neutral-400",
								)}
							/>
						)}
						{level.isPrimary && !isSelected && (
							<span className="text-[10px] text-lime-600 uppercase tracking-wider">
								Primary
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}
