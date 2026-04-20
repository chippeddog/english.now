import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	BookOpen,
	Check,
	ChevronDown,
	ChevronRight,
	FileText,
	GraduationCap,
	Loader,
	Lock,
	type LucideIcon,
	PenTool,
	Play,
	Volume2,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useUpgradeDialog } from "@/components/dashboard/upgrade-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_dashboard/lessons")({
	component: RouteComponent,
});

// ─── Types ───────────────────────────────────────────────────────────────────

type LessonType =
	| "grammar"
	| "vocabulary"
	| "reading"
	| "listening"
	| "speaking"
	| "writing"
	// Legacy block types for backward compatibility
	| "input"
	| "teach"
	| "practice"
	| "review"
	| "assessment";

type LessonStatus = "completed" | "current" | "available" | "locked";

type UnitStatus = "completed" | "active" | "locked";

interface GrammarPoint {
	title: string;
	description: string;
	examples?: string[];
}

interface VocabularyItem {
	word: string;
	pos?: string;
	definition?: string;
}

interface LessonDetail {
	description: string;
	type?: string;
	objectives?: string[];
	grammarPoints?: GrammarPoint[];
	vocabulary?: VocabularyItem[];
	rules?: GrammarPoint[];
	words?: VocabularyItem[];
	exerciseHints?: {
		types: string[];
		count: number;
	};
}

interface Lesson {
	id: string;
	title: string;
	subtitle: string;
	type: LessonType;
	status: LessonStatus;
	progress?: number; // 0-100 for completed/current
	lockReason?: string | null;
	replayAllowed?: boolean;
	detail: LessonDetail;
}

interface Unit {
	id: string;
	title: string;
	status: UnitStatus;
	progress: number; // 0-100
	lessons: Lesson[];
	lockReason?: string | null;
	unlockMessage?: string;
}

interface LevelInfo {
	level: string;
	label: string;
	percentage: number;
	nextLevel: string;
	nextPercentage: number;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const lessonTypeConfig: Record<
	string,
	{ label: string; icon: LucideIcon; color: string; bgColor: string }
> = {
	grammar: {
		label: "Grammar",
		icon: PenTool,
		color: "text-violet-600",
		bgColor: "bg-violet-100",
	},
	vocabulary: {
		label: "Vocabulary",
		icon: BookOpen,
		color: "text-sky-600",
		bgColor: "bg-sky-100",
	},
	reading: {
		label: "Reading",
		icon: FileText,
		color: "text-emerald-600",
		bgColor: "bg-emerald-100",
	},
	listening: {
		label: "Listening",
		icon: Volume2,
		color: "text-amber-600",
		bgColor: "bg-amber-100",
	},
	speaking: {
		label: "Speaking",
		icon: Play,
		color: "text-rose-600",
		bgColor: "bg-rose-100",
	},
	writing: {
		label: "Writing",
		icon: GraduationCap,
		color: "text-indigo-600",
		bgColor: "bg-indigo-100",
	},
	// Legacy block types
	input: {
		label: "Input",
		icon: BookOpen,
		color: "text-emerald-600",
		bgColor: "bg-emerald-100",
	},
	teach: {
		label: "Lesson",
		icon: PenTool,
		color: "text-blue-600",
		bgColor: "bg-blue-100",
	},
	practice: {
		label: "Practice",
		icon: Play,
		color: "text-orange-600",
		bgColor: "bg-orange-100",
	},
	review: {
		label: "Review",
		icon: FileText,
		color: "text-teal-600",
		bgColor: "bg-teal-100",
	},
	assessment: {
		label: "Assessment",
		icon: GraduationCap,
		color: "text-violet-600",
		bgColor: "bg-violet-100",
	},
};

// ─── CEFR Level Helpers ───────────────────────────────────────────────────────

const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];
const CEFR_LABELS: Record<string, string> = {
	A1: "Beginner A1",
	A2: "Elementary A2",
	B1: "Intermediate B1",
	B2: "Upper-Intermediate B2",
	C1: "Advanced C1",
	C2: "Proficiency C2",
};

function getLevelInfo(level: string, units: Unit[]): LevelInfo {
	const idx = CEFR_ORDER.indexOf(level);
	const nextLevel = CEFR_ORDER[idx + 1] ?? level;

	const totalLessons = units.reduce((sum, u) => sum + u.lessons.length, 0);
	const completedLessons = units.reduce(
		(sum, u) => sum + u.lessons.filter((l) => l.status === "completed").length,
		0,
	);
	const percentage =
		totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

	return {
		level,
		label: CEFR_LABELS[level] ?? level,
		percentage,
		nextLevel,
		nextPercentage: Math.min(percentage + 25, 100),
	};
}

function LevelHeader({ level }: { level: LevelInfo }) {
	return (
		<div
			className="overflow-hidden rounded-3xl bg-white"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<div className="p-4">
				<div className="flex items-center justify-between">
					<div className="flex w-full flex-col gap-2">
						{/* Circular progress */}
						{/* <div className="relative flex size-14 items-center justify-center">
							<svg className="size-14" viewBox="0 0 56 56" aria-hidden="true">
								<title>Level progress</title>
								<circle
									cx="28"
									cy="28"
									r="24"
									fill="none"
									stroke="currentColor"
									strokeWidth="4"
									className="text-neutral-100"
								/>
								<circle
									cx="28"
									cy="28"
									r="24"
									fill="none"
									stroke="currentColor"
									strokeWidth="4"
									strokeLinecap="round"
									strokeDasharray={`${(level.percentage / 100) * 150.8} 150.8`}
									transform="rotate(-90 28 28)"
									className="text-lime-500"
								/>
							</svg>
							<span className="absolute font-bold text-sm">
								{level.percentage}%
							</span>
						</div> */}
						<div className="mb-2 flex flex-col gap-1">
							<h2 className="font-bold">{level.label}</h2>
							<p className="text-muted-foreground text-sm">
								Reach {level.nextPercentage}% to get{" "}
								<span className="font-semibold text-foreground">
									{level.nextLevel}
								</span>
							</p>
						</div>
						<div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
							<div
								className="h-full w-[2%] rounded-full bg-neutral-800"
								style={{ width: `${level.percentage}%` }}
							/>
						</div>
						<div className="mb-1 flex items-baseline gap-1">
							<span className="font-bold text-3xl">0</span>
							<span className="text-muted-foreground text-sm">
								/ {level.nextPercentage} min
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function UnitProgressCircle({
	progress,
	status,
}: {
	progress: number;
	status: UnitStatus;
}) {
	const circumference = 2 * Math.PI * 18;
	const dashOffset = circumference - (progress / 100) * circumference;

	// if (status === "completed") {
	// 	return (
	// 		<div className="flex size-11 items-center justify-center rounded-full bg-lime-500 text-white">
	// 			<Check className="size-5" strokeWidth={2.5} />
	// 		</div>
	// 	);
	// }

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

function LessonStatusIcon({
	status,
	type,
}: {
	status: LessonStatus;
	type: LessonType;
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

	if (status === "current") {
		const Icon = config.icon;
		return (
			<div
				className={cn(
					"flex size-8 items-center justify-center rounded-full border border-amber-400 bg-amber-200 text-amber-600",
				)}
			>
				<Icon className="size-4" />
			</div>
		);
	}

	// available
	const Icon = config.icon;
	return (
		<div className="flex size-8 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-neutral-400">
			<Icon className="size-4" />
		</div>
	);
}

function LessonRowContent({
	lesson,
	onSelect,
}: {
	lesson: Lesson;
	onSelect: (lesson: Lesson) => void;
}) {
	const config = lessonTypeConfig[lesson.type];
	const isCurrent = lesson.status === "current";
	const isCompleted = lesson.status === "completed";
	const isLocked = lesson.status === "locked";

	return (
		<button
			type="button"
			onClick={() => onSelect(lesson)}
			className={cn(
				"group flex h-full min-h-12 w-full items-center gap-3 rounded-2xl py-0 text-left transition-all",
				// isCurrent && "bg-white",
				// !isCurrent && !isLocked && "hover:bg-neutral-50",
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
				<span
					className={cn(
						"text-muted-foreground text-xs",
						isCurrent && "text-muted-foreground",
					)}
				>
					{isCurrent ? config.label : lesson.subtitle}
				</span>
			</div>

			{isCurrent && (
				<div className="flex items-center gap-1 font-semibold text-muted-foreground text-sm">
					<ChevronRight className="size-5" />
				</div>
			)}

			{isCompleted && (
				<ChevronRight className="size-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
			)}

			{isLocked && <Lock className="size-3.5 text-neutral-300" />}
		</button>
	);
}

function UnitCard({
	unit,
	onSelectLesson,
	isCollapsed,
	onToggleCollapse,
}: {
	unit: Unit;
	onSelectLesson: (lesson: Lesson) => void;
	isCollapsed?: boolean;
	onToggleCollapse?: () => void;
}) {
	const isLocked = unit.status === "locked";
	const isCompleted = unit.status === "completed";
	const canCollapse = isCompleted;

	// Locked unit - compact card
	if (isLocked) {
		return (
			<div
				className="overflow-hidden rounded-3xl bg-neutral-50"
				style={{
					boxShadow:
						"rgba(162, 166, 171, 0.15) 0px 0px 0px 0px inset, rgba(162, 166, 171, 0.15) 0px 0px 6px 2px inset",
				}}
			>
				<div className="flex items-center justify-between p-4">
					<div className="flex items-center gap-3">
						<UnitProgressCircle progress={0} status="locked" />
						<div>
							<h3 className="font-semibold text-muted-foreground">
								{unit.title}
							</h3>
							{unit.unlockMessage && (
								<p className="text-muted-foreground text-xs">
									{unit.unlockMessage}
								</p>
							)}
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn("overflow-hidden rounded-3xl bg-white")}
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<div className="p-4">
				<div className="relative flex flex-col gap-4">
					{/* Vertical dashed line from circle down through lessons */}
					{!isCollapsed && unit.lessons.length > 0 && (
						<div
							className="-translate-x-1/2 absolute top-12 bottom-0 left-6 w-px border-neutral-200 border-l border-dashed"
							aria-hidden="true"
						/>
					)}
					{/* Row 1: unit header — circle and title in one row so they align */}
					<div className="flex h-12 items-center gap-3">
						<div className="relative z-10 flex w-12 shrink-0 justify-center">
							<UnitProgressCircle
								progress={unit.progress}
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
							<h3 className="font-semibold">{unit.title}</h3>
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
					{/* Lesson rows: icon and content in same row so they stay centered */}
					{!isCollapsed &&
						unit.lessons.map((lesson) => (
							<div key={lesson.id} className="flex h-12 items-center gap-3">
								<div className="relative z-10 flex w-12 shrink-0 justify-center">
									<LessonStatusIcon status={lesson.status} type={lesson.type} />
								</div>
								<div className="min-h-0 min-w-0 flex-1">
									<LessonRowContent lesson={lesson} onSelect={onSelectLesson} />
								</div>
							</div>
						))}
				</div>
			</div>
		</div>
	);
}

function LessonDetailDialog({
	lesson,
	open,
	onClose,
	onStart,
}: {
	lesson: Lesson | null;
	open: boolean;
	onClose: () => void;
	onStart: (lesson: Lesson) => void;
}) {
	if (!lesson) return null;

	const detail = lesson.detail;
	const grammarPoints = detail.grammarPoints ?? detail.rules ?? [];
	const vocabulary = detail.vocabulary ?? detail.words ?? [];

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent
				className="max-h-[85vh] overflow-y-auto sm:max-w-md"
				showCloseButton={false}
			>
				<DialogTitle className="sr-only">{lesson.title}</DialogTitle>

				{/* Close button */}
				<button
					type="button"
					onClick={onClose}
					className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200"
				>
					<X className="size-4" />
				</button>

				{/* Header */}
				<div className="text-center">
					<h2 className="font-bold font-lyon text-2xl">{lesson.title}</h2>
					<p className="mt-1 text-muted-foreground text-sm">
						{lesson.subtitle}
					</p>

					{/* Counts & type */}
					<div className="mt-3 flex items-center justify-center gap-2">
						{lessonTypeConfig[lesson.type] && (
							<Badge
								variant="outline"
								className="border-neutral-200 bg-neutral-50 text-neutral-600"
							>
								{lessonTypeConfig[lesson.type]?.label}
							</Badge>
						)}
						{vocabulary.length > 0 && (
							<Badge
								variant="outline"
								className="border-sky-200 bg-sky-50 text-sky-700"
							>
								{vocabulary.length} Words
							</Badge>
						)}
						{grammarPoints.length > 0 && (
							<Badge
								variant="outline"
								className="border-violet-200 bg-violet-50 text-violet-700"
							>
								{grammarPoints.length} Grammar
							</Badge>
						)}
					</div>
				</div>

				{/* Objectives */}
				{detail.objectives && detail.objectives.length > 0 && (
					<div className="mt-4">
						<h4 className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
							You'll Learn
						</h4>
						<ul className="flex flex-col gap-1.5">
							{detail.objectives.map((obj) => (
								<li key={obj} className="flex items-start gap-2 text-sm">
									<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-400" />
									{obj}
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Grammar Points */}
				{grammarPoints.length > 0 && (
					<div className="mt-4">
						<h4 className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
							Grammar to Practice
						</h4>
						<div className="flex flex-col gap-2">
							{grammarPoints.map((point) => (
								<div
									key={point.title}
									className="flex items-start gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-3"
								>
									<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
										<FileText className="size-4" />
									</div>
									<div>
										<p className="font-medium text-sm">{point.title}</p>
										<p className="text-muted-foreground text-xs">
											{point.description}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Vocabulary */}
				{vocabulary.length > 0 && (
					<div className="mt-4">
						<h4 className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
							Words to Practice
						</h4>
						<div className="grid grid-cols-2 gap-2">
							{vocabulary.map((w) => (
								<button
									key={w.word}
									type="button"
									className="group flex items-start gap-2 rounded-xl border border-neutral-100 bg-white p-3 text-left transition-colors hover:border-sky-200 hover:bg-sky-50"
								>
									<Volume2 className="mt-0.5 size-4 shrink-0 text-sky-500" />
									<div>
										<p className="font-semibold text-sm">{w.word}</p>
										{w.definition && (
											<p className="text-muted-foreground text-xs">
												{w.definition}
											</p>
										)}
									</div>
								</button>
							))}
						</div>
					</div>
				)}

				{/* Action Button */}
				<div className="mt-4">
					<Button
						className="h-12 w-full rounded-2xl bg-blue-600 font-semibold text-base hover:bg-blue-700"
						onClick={() => {
							if (lesson.status === "completed") {
								onStart(lesson);
							} else {
								onClose();
							}
						}}
					>
						{lesson.status === "completed" ? "Review" : "Got It!"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function FooterMessage({ message }: { message: string }) {
	return (
		<div className="flex justify-center py-6">
			<div className="rounded-full bg-neutral-100 px-5 py-2.5 text-muted-foreground text-sm">
				{message}
			</div>
		</div>
	);
}

function RouteComponent() {
	const trpc = useTRPC();
	const navigate = useNavigate();
	const { openDialog } = useUpgradeDialog();
	const { data: courseData, isLoading } = useQuery(
		trpc.content.getCourse.queryOptions(),
	);

	const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);

	const units: Unit[] = useMemo(() => {
		if (!courseData?.units) return [];
		return courseData.units.map((u) => ({
			id: u.id,
			title: u.title,
			status: u.status as UnitStatus,
			progress: u.progress,
			lessons: u.lessons.map((l) => {
				const apiLesson = l as typeof l & { lessonType?: string };
				return {
					id: l.id,
					title: l.title,
					subtitle: l.subtitle ?? "",
					type: (apiLesson.lessonType ?? l.type) as LessonType,
					status: l.status as LessonStatus,
					progress: l.progress,
					lockReason: (l as typeof l & { lockReason?: string | null })
						.lockReason,
					replayAllowed: (l as typeof l & { replayAllowed?: boolean })
						.replayAllowed,
					detail: (l.content as LessonDetail) ?? {
						description: "",
						grammarPoints: [],
						vocabulary: [],
					},
				};
			}),
			lockReason: (u as typeof u & { lockReason?: string | null }).lockReason,
			unlockMessage:
				(u as typeof u & { unlockMessage?: string | undefined })
					.unlockMessage ??
				(u.status === "locked"
					? "Complete previous units to unlock"
					: undefined),
		}));
	}, [courseData]);

	const levelInfo = useMemo(
		() => getLevelInfo(courseData?.level ?? "B1", units),
		[courseData?.level, units],
	);

	// Completed units start collapsed by default
	const [collapsedUnits, setCollapsedUnits] = useState<Set<string>>(new Set());
	const [showCompletedUnits, setShowCompletedUnits] = useState(false);

	// Set initial collapsed state when data loads
	useMemo(() => {
		if (units.length > 0) {
			setCollapsedUnits(
				new Set(units.filter((u) => u.status === "completed").map((u) => u.id)),
			);
		}
	}, [units]);

	const visibleUnits = useMemo(
		() => units.filter((unit) => unit.status !== "completed"),
		[units],
	);
	const completedUnits = useMemo(
		() => units.filter((unit) => unit.status === "completed"),
		[units],
	);
	const displayedUnits = useMemo(
		() => (showCompletedUnits ? units : visibleUnits),
		[showCompletedUnits, units, visibleUnits],
	);

	const handleSelectLesson = (lesson: Lesson) => {
		if (
			lesson.status === "locked" &&
			(lesson.lockReason === "free_unit_locked" ||
				lesson.lockReason === "daily_new_lesson_limit")
		) {
			openDialog();
			return;
		}

		if (lesson.status === "current" || lesson.status === "available") {
			navigate({ to: "/lesson/$lessonId", params: { lessonId: lesson.id } });
			return;
		}
		setSelectedLesson(lesson);
		setDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setDialogOpen(false);
		setSelectedLesson(null);
	};

	const toggleUnitCollapse = (unitId: string) => {
		setCollapsedUnits((prev) => {
			const next = new Set(prev);
			if (next.has(unitId)) {
				next.delete(unitId);
			} else {
				next.add(unitId);
			}
			return next;
		});
	};

	if (isLoading) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center">
				<Loader className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!courseData || units.length === 0) {
		return (
			<div className="flex min-h-[50vh] flex-col items-center justify-center gap-2">
				<p className="text-muted-foreground">No lessons available yet.</p>
				<p className="text-muted-foreground text-sm">
					Complete onboarding to generate your personalized learning path.
				</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			<div className="container relative z-10 mx-auto max-w-5xl px-4 py-6 pt-8">
				<div className="mb-6 flex items-center gap-1">
					<h1 className="font-bold font-lyon text-3xl tracking-tight md:text-3xl">
						Lessons
					</h1>
				</div>
				<div className="grid grid-cols-1 gap-5 md:grid-cols-3">
					<div className="order-2 space-y-4 lg:order-first lg:col-span-2">
						{displayedUnits.map((u) => (
							<UnitCard
								key={u.id}
								unit={u}
								onSelectLesson={handleSelectLesson}
								isCollapsed={collapsedUnits.has(u.id)}
								onToggleCollapse={() => toggleUnitCollapse(u.id)}
							/>
						))}
						<FooterMessage message="Finish these lessons to receive new material." />
					</div>

					<div className="flex flex-col gap-2">
						<LevelHeader level={levelInfo} />
						{completedUnits.length > 0 && (
							<section className="flex items-center justify-between px-4 py-3">
								<div>
									<p className="font-medium text-sm">Show completed units</p>
									{/* <p className="text-muted-foreground text-xs">
										{completedUnits.length} completed
									</p> */}
								</div>
								<Switch
									checked={showCompletedUnits}
									onCheckedChange={setShowCompletedUnits}
									aria-label="Show completed units"
								/>
							</section>
						)}
					</div>
				</div>
			</div>
			<LessonDetailDialog
				lesson={selectedLesson}
				open={dialogOpen}
				onClose={handleCloseDialog}
				onStart={(lesson) => {
					handleCloseDialog();
					navigate({
						to: "/lesson/$lessonId",
						params: { lessonId: lesson.id },
					});
				}}
			/>
		</div>
	);
}
