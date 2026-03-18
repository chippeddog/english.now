import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
	ArrowRight,
	BookOpen,
	CheckIcon,
	ChevronRight,
	FileText,
	GraduationCap,
	Lock,
	PenTool,
	Play,
	Volume2,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LessonStatus = "completed" | "current" | "available" | "locked";
type UnitStatus = "completed" | "active" | "locked";

interface DashboardLesson {
	id: string;
	title: string;
	subtitle?: string | null;
	type: string;
	lessonType?: string | null;
	status: LessonStatus;
	lockReason?: string | null;
}

interface DashboardUnit {
	id: string;
	title: string;
	status: UnitStatus;
	progress: number;
	unlockMessage?: string;
	lessons: DashboardLesson[];
}

interface LessonsProps {
	courseData?: {
		units: DashboardUnit[];
	} | null;
	isLoading?: boolean;
}

const lessonTypeConfig: Record<
	string,
	{ icon: LucideIcon; color: string; bgColor: string }
> = {
	grammar: {
		icon: PenTool,
		color: "text-violet-600",
		bgColor: "bg-violet-100",
	},
	vocabulary: {
		icon: BookOpen,
		color: "text-sky-600",
		bgColor: "bg-sky-100",
	},
	reading: {
		icon: FileText,
		color: "text-emerald-600",
		bgColor: "bg-emerald-100",
	},
	listening: {
		icon: Volume2,
		color: "text-amber-600",
		bgColor: "bg-amber-100",
	},
	speaking: {
		icon: Play,
		color: "text-rose-600",
		bgColor: "bg-rose-100",
	},
	writing: {
		icon: GraduationCap,
		color: "text-indigo-600",
		bgColor: "bg-indigo-100",
	},
	input: {
		icon: BookOpen,
		color: "text-emerald-600",
		bgColor: "bg-emerald-100",
	},
	teach: {
		icon: PenTool,
		color: "text-violet-600",
		bgColor: "bg-violet-100",
	},
	practice: {
		icon: Play,
		color: "text-sky-600",
		bgColor: "bg-sky-100",
	},
	review: {
		icon: CheckIcon,
		color: "text-lime-600",
		bgColor: "bg-lime-100",
	},
	assessment: {
		icon: GraduationCap,
		color: "text-indigo-600",
		bgColor: "bg-indigo-100",
	},
};

function UnitProgressCircle({
	progress,
	status,
}: {
	progress: number;
	status: UnitStatus;
}) {
	if (status === "locked") {
		return (
			<div className="flex size-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
				<Lock className="size-4" />
			</div>
		);
	}

	const circumference = 2 * Math.PI * 18;
	const dashOffset = circumference - (progress / 100) * circumference;

	return (
		<div className="relative flex size-11 items-center justify-center">
			<svg className="size-12" viewBox="0 0 44 44" aria-hidden="true">
				<title>Unit progress</title>
				<circle
					cx="22"
					cy="22"
					r="18"
					fill="none"
					stroke="currentColor"
					strokeWidth="3.5"
					className="text-neutral-100"
				/>
				<circle
					cx="22"
					cy="22"
					r="18"
					fill="none"
					stroke="currentColor"
					strokeWidth="3.5"
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

function LessonIcon({ lesson }: { lesson: DashboardLesson }) {
	const config =
		lessonTypeConfig[lesson.lessonType ?? lesson.type] ??
		lessonTypeConfig.vocabulary;

	if (lesson.status === "completed") {
		return (
			<div className="flex size-7.5 items-center justify-center rounded-full border border-lime-400 bg-lime-200 text-lime-600">
				<CheckIcon className="size-4" strokeWidth={2.5} />
			</div>
		);
	}

	if (lesson.status === "locked") {
		return (
			<div className="flex size-7.5 items-center justify-center rounded-full bg-neutral-100 text-neutral-300">
				<Lock className="size-3.5" />
			</div>
		);
	}

	const Icon = config.icon;
	return (
		<div
			className={cn(
				"flex size-7.5 items-center justify-center rounded-full",
				lesson.status === "current"
					? "border border-amber-400 bg-amber-200 text-amber-600"
					: "border border-neutral-200 bg-neutral-100 text-neutral-400",
			)}
		>
			<Icon className="size-4" />
		</div>
	);
}

function NextUnitIcon({ status }: { status: UnitStatus }) {
	if (status === "locked") {
		return (
			<div className="flex size-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-300">
				<Lock className="size-3.5" />
			</div>
		);
	}

	return (
		<div className="flex size-8 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-neutral-400">
			<ArrowRight className="size-4" />
		</div>
	);
}

function getLessonsSummary(courseData?: LessonsProps["courseData"]) {
	const units = courseData?.units ?? [];
	if (units.length === 0) return null;

	const currentUnit =
		units.find((unit) => unit.status === "active") ??
		[...units].reverse().find((unit) => unit.status !== "locked") ??
		units[0];

	if (!currentUnit) return null;

	const currentLesson =
		currentUnit.lessons.find((lesson) => lesson.status === "current") ??
		currentUnit.lessons.find((lesson) => lesson.status === "available") ??
		currentUnit.lessons[currentUnit.lessons.length - 1] ??
		null;

	if (!currentLesson) {
		return { currentUnit, currentLesson: null, nextStep: null };
	}

	const currentUnitIndex = units.findIndex(
		(unit) => unit.id === currentUnit.id,
	);
	const currentLessonIndex = currentUnit.lessons.findIndex(
		(lesson) => lesson.id === currentLesson.id,
	);
	const nextLesson = currentUnit.lessons[currentLessonIndex + 1] ?? null;

	if (nextLesson) {
		return {
			currentUnit,
			currentLesson,
			nextStep: {
				kind: "lesson" as const,
				lesson: nextLesson,
			},
		};
	}

	const nextUnit = units[currentUnitIndex + 1] ?? null;
	if (!nextUnit) {
		return { currentUnit, currentLesson, nextStep: null };
	}

	return {
		currentUnit,
		currentLesson,
		nextStep: {
			kind: "unit" as const,
			unit: nextUnit,
		},
	};
}

function SummaryRow({
	title,
	subtitle,
	muted,
	action,
}: {
	title: string;
	subtitle: string;
	muted?: boolean;
	action?: ReactNode;
}) {
	return (
		<div className="flex min-h-12 flex-1 items-center justify-between gap-3 px-1 py-1">
			<div className="min-w-0 flex-1">
				<p
					className={cn(
						"font-medium text-xs leading-5",
						muted ? "text-neutral-400" : "text-neutral-900",
					)}
				>
					{title.slice(0, 30)}
					{title.length > 30 && "..."}
				</p>
				<p
					className={cn(
						"text-xs leading-4",
						muted ? "text-neutral-400" : "text-muted-foreground",
					)}
				>
					{subtitle}
				</p>
			</div>
			{action}
		</div>
	);
}

function getLessonLockLabel(
	lockReason: string | null | undefined,
	fallback: string,
) {
	if (lockReason === "free_unit_locked") {
		return "Upgrade to unlock";
	}

	if (lockReason === "daily_new_lesson_limit") {
		return "New lesson available tomorrow";
	}

	return fallback;
}

export default function Lessons({
	courseData,
	isLoading = false,
}: LessonsProps) {
	const summary = getLessonsSummary(courseData);

	return (
		<div
			className="relative overflow-hidden rounded-3xl bg-white p-2.5"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			{!isLoading && summary && summary?.currentLesson && (
				<div className="-bottom-3 absolute right-0 left-0 z-20 h-24 w-full bg-linear-to-t from-white to-transparent" />
			)}
			<div className="mb-2 flex items-center justify-between gap-2 pl-1.5">
				<div className="font-bold font-lyon text-xl">Lessons</div>
			</div>

			{isLoading ? (
				<div className="space-y-4 p-1">
					<div className="h-10 animate-pulse rounded-2xl bg-neutral-100" />
					<div className="h-10 animate-pulse rounded-2xl bg-neutral-100" />
					<div className="h-10 animate-pulse rounded-2xl bg-neutral-100" />
				</div>
			) : !summary || !summary.currentLesson ? (
				<div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-border/50 px-4 py-5 text-center">
					<p className="font-medium text-sm">No active lessons yet.</p>
					<p className="mt-1 text-muted-foreground text-xs">
						Complete onboarding to generate your learning path.
					</p>
				</div>
			) : (
				<div className="relative flex flex-col gap-4">
					<div
						className="-translate-x-1/2 absolute top-12 bottom-5 left-6 h-full w-px border-neutral-200 border-l border-dashed"
						aria-hidden="true"
					/>

					<div className="flex min-h-12 items-center gap-1">
						<div className="relative z-10 flex w-12 shrink-0 items-center justify-center">
							<UnitProgressCircle
								progress={summary.currentUnit.progress}
								status={summary.currentUnit.status}
							/>
						</div>
						<div className="min-w-0 flex-1">
							<h2 className="truncate font-semibold text-sm">
								{summary.currentUnit.title}
							</h2>
						</div>
					</div>

					<div className="flex min-h-12 items-center">
						<div className="relative z-10 flex w-12 shrink-0 items-center justify-center">
							<LessonIcon lesson={summary.currentLesson} />
						</div>
						<SummaryRow
							title={summary.currentLesson.title}
							subtitle={
								summary.currentLesson.status === "locked"
									? getLessonLockLabel(
											summary.currentLesson.lockReason,
											"Locked",
										)
									: summary.currentLesson.subtitle || "Current lesson"
							}
							action={
								summary.currentLesson.status !== "locked" ? (
									<Link
										className="text-muted-foreground"
										to="/lesson/$lessonId"
										params={{ lessonId: summary.currentLesson.id }}
									>
										<ChevronRight className="size-4" />
									</Link>
								) : null
							}
						/>
					</div>

					{summary.nextStep && (
						<div className="flex min-h-12 items-center">
							<div className="relative z-10 flex w-12 shrink-0 items-center justify-center">
								{summary.nextStep.kind === "lesson" ? (
									<LessonIcon lesson={summary.nextStep.lesson} />
								) : (
									<NextUnitIcon status={summary.nextStep.unit.status} />
								)}
							</div>
							<SummaryRow
								title={
									summary.nextStep.kind === "lesson"
										? summary.nextStep.lesson.title
										: summary.nextStep.unit.title
								}
								subtitle={
									summary.nextStep.kind === "lesson"
										? summary.nextStep.lesson.status === "locked"
											? getLessonLockLabel(
													summary.nextStep.lesson.lockReason,
													"Next lesson",
												)
											: summary.nextStep.lesson.subtitle || "Next lesson"
										: summary.nextStep.unit.status === "locked"
											? summary.nextStep.unit.unlockMessage || "Next unit"
											: "Continue to the next unit"
								}
								muted={
									summary.nextStep.kind === "lesson"
										? summary.nextStep.lesson.status === "locked"
										: summary.nextStep.unit.status === "locked"
								}
								action={
									summary.nextStep.kind === "lesson" &&
									summary.nextStep.lesson.status !== "locked" ? (
										<Link
											to="/lesson/$lessonId"
											params={{ lessonId: summary.nextStep.lesson.id }}
										>
											<ChevronRight className="size-4 text-muted-foreground" />
										</Link>
									) : summary.nextStep.kind === "unit" ? (
										<Link to="/lessons">
											<ChevronRight className="size-4 text-muted-foreground" />
										</Link>
									) : null
								}
							/>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
