import type { CefrLevel } from "@/types/lesson";

const CEFR_LABELS: Record<CefrLevel, string> = {
	A1: "Beginner A1",
	A2: "Elementary A2",
	B1: "Intermediate B1",
	B2: "Upper-Intermediate B2",
	C1: "Advanced C1",
	C2: "Proficiency C2",
};

interface LevelOverviewCardProps {
	level: CefrLevel;
	totalLessons: number;
	completedLessons: number;
	progressPercent: number;
}

export function LevelOverviewCard({
	level,
	totalLessons,
	completedLessons,
	progressPercent,
}: LevelOverviewCardProps) {
	return (
		<div
			className="overflow-hidden rounded-3xl bg-white"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<div className="flex flex-col gap-3 p-4">
				<div className="flex flex-col gap-1">
					<h2 className="font-bold">{CEFR_LABELS[level]}</h2>
					<p className="text-muted-foreground text-sm">
						{completedLessons} of {totalLessons} lessons completed
					</p>
				</div>
				<div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
					<div
						className="h-full rounded-full bg-neutral-800 transition-[width] duration-500"
						style={{ width: `${progressPercent}%` }}
					/>
				</div>
				<div className="flex items-baseline gap-1">
					<span className="font-bold text-3xl">{progressPercent}</span>
					<span className="text-muted-foreground text-sm">% complete</span>
				</div>
			</div>
		</div>
	);
}
