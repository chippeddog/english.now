import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useUpgradeDialog } from "@/components/dashboard/upgrade-dialog";
import { LessonDetailDrawer } from "@/components/lessons/lesson-detail-drawer";
import {
	type LevelSummary,
	LevelSwitcher,
} from "@/components/lessons/level-switcher";
import { LevelOverviewCard } from "@/components/lessons/level-overview-card";
import { resolveLessonType } from "@/components/lessons/lesson-type-config";
import { UnitCard } from "@/components/lessons/unit-card";
import { Switch } from "@/components/ui/switch";
import type {
	CefrLevel,
	LessonDetail,
	LessonStatus,
	LessonTreeLesson,
	LessonTreeUnit,
	UnitStatus,
} from "@/types/lesson";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_dashboard/lessons")({
	component: RouteComponent,
});

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

	if (!levels || (activeLevel && isLoading)) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center">
				<Loader className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			<div className="container relative z-10 mx-auto max-w-2xl px-4 py-6 pt-8">
				<div className="mb-4 flex items-center gap-1">
					<h1 className="font-bold font-lyon text-3xl tracking-tight md:text-3xl">
						Lessons
					</h1>
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
						{selectedLevelSummary && (
							<LevelOverviewCard
								level={selectedLevelSummary.level}
								totalLessons={selectedLevelSummary.totalLessons}
								completedLessons={selectedLevelSummary.completedLessons}
								progressPercent={selectedLevelSummary.progressPercent}
							/>
						)}

						{displayedUnits.map((u) => (
							<UnitCard
								key={u.id}
								unit={u}
								onSelectLesson={handleSelectLesson}
								isCollapsed={collapsedUnits.has(u.id)}
								onToggleCollapse={() => toggleUnitCollapse(u.id)}
							/>
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
				)}
			</div>
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
