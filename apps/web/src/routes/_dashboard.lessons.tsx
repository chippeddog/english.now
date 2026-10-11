import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	Check,
	Loader,
	Lock,
	Map as MapIcon,
	Play,
	Star,
	X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useUpgradeDialog } from "@/components/dashboard/upgrade-dialog";
import { LessonDetailDrawer } from "@/components/lessons/lesson-detail-drawer";
import { resolveLessonType } from "@/components/lessons/lesson-type-config";
import {
	type LevelSummary,
	LevelSwitcher,
} from "@/components/lessons/level-switcher";
import { UnitCard } from "@/components/lessons/unit-card";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type {
	CefrLevel,
	LessonDetail,
	LessonStatus,
	LessonTreeLesson,
	LessonTreeUnit,
	UnitStatus,
} from "@/types/lesson";
import { createTitle, PAGE_TITLE } from "@/utils/title";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_dashboard/lessons")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{
				title: createTitle(PAGE_TITLE.lessons),
			},
		],
	}),
});

const CEFR_LABELS: Record<CefrLevel, string> = {
	A1: "Beginner",
	A2: "Elementary",
	B1: "Intermediate",
	B2: "Upper-Intermediate",
	C1: "Advanced",
	C2: "Proficiency",
};

const NEXT_CEFR_LEVEL: Partial<Record<CefrLevel, CefrLevel>> = {
	A1: "A2",
	A2: "B1",
	B1: "B2",
	B2: "C1",
	C1: "C2",
};

function FooterMessage({ message }: { message: string }) {
	return (
		<div className="flex justify-center py-6">
			<div className="rounded-full bg-neutral-100 px-5 py-2.5 text-muted-foreground text-sm">
				{message}
			</div>
		</div>
	);
}

function formatMinutes(minutes: number) {
	return `${minutes} min`;
}

function getLessonMinutes(lesson: LessonTreeLesson) {
	return lesson.estimatedMinutes ?? 10;
}

function formatRemainingHours(minutes: number) {
	return `~${Math.max(1, Math.round(minutes / 60))}h`;
}

function LearningPathOverview({
	summary,
	units,
}: {
	summary: LevelSummary;
	units: LessonTreeUnit[];
}) {
	const nextLevel = NEXT_CEFR_LEVEL[summary.level];
	const remainingMinutes = units.reduce(
		(total, unit) =>
			total +
			unit.lessons.reduce(
				(unitTotal, lesson) =>
					lesson.status === "completed"
						? unitTotal
						: unitTotal + getLessonMinutes(lesson),
				0,
			),
		0,
	);

	return (
		<section className="border-border/70 border-b pb-6">
			<div className="flex justify-between gap-5 lg:items-end">
				<div className="min-w-0">
					<h1 className="font-bold font-lyon text-2xl tracking-tight md:text-3xl">
						Lessons
					</h1>
					<p className="mt-3 max-w-2xl text-muted-foreground text-sm leading-6 md:text-base">
						A guided route from {CEFR_LABELS[summary.level]}{" "}
						{nextLevel ? `to ${nextLevel}` : "to fluency"} - {units.length}{" "}
						units, each unlocking the next. You're {summary.progressPercent}%
						through.
					</p>
				</div>
				<div className="grid grid-cols-3 gap-6 lg:gap-10">
					<div>
						<p className="font-bold text-xl tracking-tight">
							{summary.completedLessons}/{summary.totalLessons}
						</p>
						<p className="mt-1 text-muted-foreground text-xs">lessons done</p>
					</div>
				</div>
			</div>
		</section>
	);
}

function CourseMap({
	units,
	activeUnitId,
	onSelectUnit,
	className,
	showHeading = true,
}: {
	units: LessonTreeUnit[];
	activeUnitId: string | null;
	onSelectUnit: (unit: LessonTreeUnit) => void;
	className?: string;
	showHeading?: boolean;
}) {
	return (
		<aside className={cn("h-fit self-start", className)}>
			<div
				className={cn(
					showHeading &&
						"rounded-3xl border border-border/70 bg-white p-4 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.4)]",
				)}
			>
				{showHeading && (
					<p className="mb-5 px-1 font-semibold text-sm">Course Map</p>
				)}
				<div className="relative space-y-1">
					{units.map((unit, index) => {
						const isCompleted = unit.status === "completed";
						const isActive =
							unit.id === activeUnitId || unit.status === "active";
						const isLocked = unit.status === "locked";
						const totalMinutes = unit.lessons.reduce(
							(total, lesson) => total + getLessonMinutes(lesson),
							0,
						);
						const remainingMinutes = unit.lessons.reduce(
							(total, lesson) =>
								lesson.status === "completed"
									? total
									: total + getLessonMinutes(lesson),
							0,
						);
						const isMilestone = index === units.length - 1;

						return (
							<button
								key={unit.id}
								type="button"
								onClick={() => onSelectUnit(unit)}
								className="group relative grid w-full grid-cols-[2.75rem_minmax(0,1fr)] gap-1 rounded-2xl text-left"
							>
								<div className="relative flex justify-center">
									{index < units.length - 1 && (
										<span
											className={cn(
												"-bottom-4.5 absolute top-9 border-l border-dashed",
												isCompleted
													? "border-emerald-600"
													: "border-neutral-200",
											)}
											aria-hidden="true"
										/>
									)}
									<span
										className={cn(
											"relative z-10 mt-2 flex size-7 items-center justify-center rounded-full border bg-white transition-colors",
											isCompleted &&
												"border-emerald-600 bg-emerald-600 text-white",
											isActive &&
												"border-teal-700 bg-teal-700 text-white ring-4 ring-teal-100",
											isLocked &&
												"border-neutral-200 bg-white text-neutral-300",
										)}
									>
										{isCompleted ? (
											<Check className="size-4" strokeWidth={3} />
										) : isActive ? (
											<Play className="ml-0.5 size-3.5 fill-current" />
										) : isMilestone ? (
											<Star className="size-3.5" />
										) : isLocked ? (
											<Lock className="size-3.5" />
										) : null}
									</span>
								</div>
								<div
									className={cn(
										"min-w-0 rounded-xl px-3 py-2 transition-colors",
										isActive && "bg-neutral-100",
										!isActive && "group-hover:bg-neutral-50",
									)}
								>
									<div className="flex items-center gap-2">
										<p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.16em]">
											Unit {index + 1}
										</p>
										{isActive && (
											<span className="rounded-full bg-teal-700 px-2 py-0.5 font-bold text-[9px] text-white uppercase tracking-wide">
												Now
											</span>
										)}
										{!isActive && isMilestone && (
											<span className="rounded-full bg-orange-100 px-2 py-0.5 font-bold text-[9px] text-orange-600 uppercase tracking-wide">
												Milestone
											</span>
										)}
									</div>
									<h3
										className={cn(
											"truncate font-semibold text-sm",
											isLocked && "text-neutral-400",
										)}
									>
										{unit.title}
									</h3>
									<p
										className={cn(
											"truncate text-muted-foreground text-xs",
											isLocked && "text-neutral-400",
										)}
									>
										{unit.lessons.length} lessons ·{" "}
										{formatMinutes(totalMinutes)}
										{isActive && remainingMinutes > 0
											? ` · ${formatMinutes(remainingMinutes)} left`
											: ""}
									</p>
								</div>
							</button>
						);
					})}
				</div>
			</div>
		</aside>
	);
}

function RouteComponent() {
	const trpc = useTRPC();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { openDialog } = useUpgradeDialog();

	const { data: levels } = useQuery(
		trpc.content.listEnrollments.queryOptions(),
	);

	const primaryLevel = useMemo<CefrLevel | null>(
		() => levels?.find((l) => l.isPrimary)?.level ?? null,
		[levels],
	);

	const [selectedLevel, setSelectedLevel] = useState<CefrLevel | null>(null);

	// Default selection syncs to the user's primary level the first time the
	// list loads, then falls back to the first available level if none is
	// primary.
	useEffect(() => {
		if (selectedLevel || !levels) return;
		const fallback =
			primaryLevel ??
			levels.find((l) => l.enrollmentId)?.level ??
			levels.find((l) => l.courseVersionId)?.level ??
			null;
		if (fallback) setSelectedLevel(fallback);
	}, [levels, primaryLevel, selectedLevel]);

	const activeLevel = selectedLevel ?? primaryLevel;

	const { data: courseData, isLoading } = useQuery({
		...trpc.content.getCourse.queryOptions(
			activeLevel ? { level: activeLevel } : undefined,
		),
		enabled: Boolean(activeLevel),
	});

	const setActiveMutation = useMutation(
		trpc.content.setActiveLevel.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.content.listEnrollments.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.content.getCourse.queryKey(),
				});
			},
		}),
	);

	const units = useMemo<LessonTreeUnit[]>(() => {
		if (!courseData?.units) return [];
		return courseData.units.map((u) => ({
			id: u.id,
			title: u.title,
			status: u.status as UnitStatus,
			progress: u.progress,
			lockReason: (u as typeof u & { lockReason?: string | null }).lockReason,
			unlockMessage:
				(u as typeof u & { unlockMessage?: string | undefined })
					.unlockMessage ??
				(u.status === "locked"
					? "Complete previous units to unlock"
					: undefined),
			lessons: u.lessons.map((l) => {
				const apiLesson = l as typeof l & { lessonType?: string };
				return {
					id: l.id,
					title: l.title,
					subtitle: l.subtitle ?? "",
					type: resolveLessonType(apiLesson.lessonType, l.type),
					status: l.status as LessonStatus,
					progress: l.progress,
					estimatedMinutes:
						(l as typeof l & { estimatedMinutes?: number | null })
							.estimatedMinutes ?? null,
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
		}));
	}, [courseData]);

	const [collapsedUnits, setCollapsedUnits] = useState<Set<string>>(new Set());
	const [showCompletedUnits, setShowCompletedUnits] = useState(false);
	const [selectedLesson, setSelectedLesson] = useState<LessonTreeLesson | null>(
		null,
	);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [courseMapOpen, setCourseMapOpen] = useState(false);

	useEffect(() => {
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
	const displayedUnits = showCompletedUnits ? units : visibleUnits;
	const activeUnitId = useMemo(
		() =>
			units.find((unit) => unit.status === "active")?.id ??
			units.find((unit) =>
				unit.lessons.some((lesson) => lesson.status === "current"),
			)?.id ??
			units.find((unit) => unit.status !== "locked")?.id ??
			null,
		[units],
	);

	const selectedLevelSummary: LevelSummary | null = useMemo(() => {
		if (!levels || !activeLevel) return null;
		return levels.find((l) => l.level === activeLevel) ?? null;
	}, [levels, activeLevel]);

	const handleSelectLevel = (level: LevelSummary) => {
		if (level.status === "unavailable") return;

		if (level.requiresUpgrade && !level.enrollmentId) {
			openDialog();
			return;
		}

		setSelectedLevel(level.level);
		setActiveMutation.mutate({ level: level.level });
	};

	const handleSelectLesson = (lesson: LessonTreeLesson) => {
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

	const handleSelectUnit = (unit: LessonTreeUnit) => {
		if (unit.status === "locked" && unit.lockReason === "free_unit_locked") {
			openDialog();
			return;
		}

		if (unit.status === "completed" && !showCompletedUnits) {
			setShowCompletedUnits(true);
		}

		setCollapsedUnits((prev) => {
			const next = new Set(prev);
			next.delete(unit.id);
			return next;
		});

		window.requestAnimationFrame(() => {
			document
				.getElementById(`unit-${unit.id}`)
				?.scrollIntoView({ behavior: "smooth", block: "start" });
		});
	};

	if (!levels || (activeLevel && isLoading)) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center">
				<Loader className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			<div className="container relative z-10 mx-auto max-w-5xl px-4 py-6 pt-8">
				<div className="mb-6">
					{courseData && units.length > 0 && selectedLevelSummary ? (
						<LearningPathOverview
							summary={selectedLevelSummary}
							units={units}
						/>
					) : (
						<h1 className="font-bold font-lyon text-3xl tracking-tight md:text-3xl">
							Lessons
						</h1>
					)}
				</div>

				<div className="mb-6">
					<LevelSwitcher
						levels={levels}
						selectedLevel={activeLevel ?? "A1"}
						onSelect={handleSelectLevel}
					/>
				</div>

				{!courseData || units.length === 0 ? (
					<div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
						<p className="text-muted-foreground">
							No lessons available for this level yet.
						</p>
						<p className="text-muted-foreground text-sm">
							Pick another level above or complete onboarding to generate your
							learning path.
						</p>
					</div>
				) : (
					<div className="space-y-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => setCourseMapOpen(true)}
							className="h-12 w-full justify-between rounded-2xl border-border/70 bg-white px-4 lg:hidden"
						>
							<span className="flex items-center gap-2">
								<MapIcon className="size-4 text-teal-700" />
								Course map
							</span>
							<span className="text-muted-foreground text-xs">
								{units.length} units
							</span>
						</Button>

						<div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
							<div className="space-y-4">
								{displayedUnits.map((u) => (
									<div key={u.id} id={`unit-${u.id}`} className="scroll-mt-24">
										<UnitCard
											unit={u}
											onSelectLesson={handleSelectLesson}
											isCollapsed={collapsedUnits.has(u.id)}
											onToggleCollapse={() => toggleUnitCollapse(u.id)}
										/>
									</div>
								))}

								{completedUnits.length > 0 && (
									<section className="flex items-center justify-between px-4 py-3">
										<p className="font-medium text-sm">Show completed units</p>
										<Switch
											checked={showCompletedUnits}
											onCheckedChange={setShowCompletedUnits}
											aria-label="Show completed units"
										/>
									</section>
								)}

								<FooterMessage message="Finish these lessons to receive new material." />
							</div>
							<CourseMap
								units={units}
								activeUnitId={activeUnitId}
								onSelectUnit={handleSelectUnit}
								className="sticky top-24 hidden lg:block"
							/>
						</div>
					</div>
				)}
			</div>
			<Drawer
				open={courseMapOpen}
				onOpenChange={setCourseMapOpen}
				direction="right"
			>
				<DrawerContent className="flex h-dvh w-full max-w-88 flex-col gap-0 overflow-hidden rounded-none rounded-l-3xl border-black/5 p-0 shadow-2xl lg:hidden">
					<DrawerHeader className="gap-1.5 border-black/5 border-b px-6 py-5 text-left">
						<DrawerTitle className="font-bold font-lyon text-xl">
							Course Map
						</DrawerTitle>
						<DrawerClose asChild>
							<button
								type="button"
								className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-700"
								aria-label="Close course map"
							>
								<X className="size-4" />
							</button>
						</DrawerClose>
					</DrawerHeader>
					<div className="flex-1 overflow-y-auto p-4">
						<CourseMap
							units={units}
							activeUnitId={activeUnitId}
							onSelectUnit={(unit) => {
								setCourseMapOpen(false);
								handleSelectUnit(unit);
							}}
							showHeading={false}
						/>
					</div>
				</DrawerContent>
			</Drawer>
			<LessonDetailDrawer
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
