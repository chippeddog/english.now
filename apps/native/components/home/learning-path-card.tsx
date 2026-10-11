import { Ionicons } from "@expo/vector-icons";
import type React from "react";
import { Pressable, Text, View } from "react-native";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CourseData, CourseLesson, CourseUnit } from "@/lib/api-types";
import { openOnWeb } from "@/lib/open-on-web";
import { LessonIcon, UnitStatusIcon } from "./lesson-icons";

type NextStep =
	| { kind: "lesson"; lesson: CourseLesson }
	| { kind: "unit"; unit: CourseUnit };

function getLessonsSummary(courseData: CourseData | null) {
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
	if (!currentLesson) return null;

	const unitIndex = units.findIndex((unit) => unit.id === currentUnit.id);
	const lessonIndex = currentUnit.lessons.findIndex(
		(lesson) => lesson.id === currentLesson.id,
	);
	const nextLesson = currentUnit.lessons[lessonIndex + 1];
	const nextUnit = units[unitIndex + 1];

	const nextStep: NextStep | null = nextLesson
		? { kind: "lesson", lesson: nextLesson }
		: nextUnit
			? { kind: "unit", unit: nextUnit }
			: null;

	return { currentUnit, unitIndex, currentLesson, nextStep };
}

function getLessonLockLabel(
	lockReason: string | null | undefined,
	fallback: string,
) {
	if (lockReason === "free_unit_locked") return "Upgrade to unlock";
	if (lockReason === "daily_new_lesson_limit")
		return "New lesson available tomorrow";
	return fallback;
}

function lessonType(lesson: CourseLesson) {
	return lesson.lessonType ?? lesson.type;
}

function Row({
	icon,
	title,
	subtitle,
	muted = false,
	active = false,
	onPress,
}: {
	icon: React.ReactNode;
	title: string;
	subtitle: string;
	muted?: boolean;
	active?: boolean;
	onPress?: () => void;
}) {
	return (
		<View className="min-h-14 flex-row gap-2">
			<View className="z-10 w-8 items-center pt-2">{icon}</View>
			<Pressable
				onPress={onPress}
				disabled={!onPress}
				accessibilityRole={onPress ? "button" : undefined}
				className={`flex-1 flex-row items-center justify-between gap-3 rounded-xl px-3 py-2 active:opacity-70 ${active ? "bg-neutral-100" : ""}`}
			>
				<View className="flex-1">
					<Text
						className={`font-semibold text-sm ${muted ? "text-neutral-400" : "text-neutral-900"}`}
						numberOfLines={1}
					>
						{title}
					</Text>
					<Text
						className={`text-xs ${muted ? "text-neutral-400" : "text-neutral-500"}`}
						numberOfLines={1}
					>
						{subtitle}
					</Text>
				</View>
				{onPress ? (
					<Ionicons name="chevron-forward" size={16} color="#a3a3a3" />
				) : null}
			</Pressable>
		</View>
	);
}

export function LearningPathCard({
	courseData,
	isLoading,
}: {
	courseData: CourseData | null;
	isLoading: boolean;
}) {
	const summary = getLessonsSummary(courseData);
	const nextLesson =
		summary?.nextStep?.kind === "lesson" ? summary.nextStep.lesson : null;
	const nextUnit =
		summary?.nextStep?.kind === "unit" ? summary.nextStep.unit : null;

	return (
		<Card>
			<CardHeader
				title="Learning Path"
				actionLabel="View all"
				onAction={() => openOnWeb("/lessons")}
			/>

			{isLoading ? (
				<View className="gap-4 p-1">
					<Skeleton className="h-10 rounded-2xl" />
					<Skeleton className="h-10 rounded-2xl" />
					<Skeleton className="h-10 rounded-2xl" />
				</View>
			) : !summary ? (
				<View className="min-h-40 items-center justify-center rounded-2xl border border-neutral-100 px-4 py-5">
					<Text className="font-medium text-neutral-500 text-sm">
						No active lessons yet.
					</Text>
				</View>
			) : (
				<View className="gap-1">
					<View
						className="absolute top-9 bottom-9 left-3.5 border-neutral-200 border-l border-dashed"
						aria-hidden
					/>

					<View className="min-h-14 flex-row gap-2">
						<View className="z-10 w-8 items-center pt-2">
							<UnitStatusIcon status={summary.currentUnit.status} />
						</View>
						<View className="flex-1 px-3 py-2">
							<View className="mb-0.5 flex-row items-center gap-2">
								<Text className="font-medium text-[11px] text-neutral-500 uppercase italic">
									Unit {summary.unitIndex + 1}
								</Text>
								{summary.currentUnit.status === "active" ? (
									<View className="rounded-full bg-lime-200 px-2 py-0.5">
										<Text className="font-bold text-[9px] text-lime-700 uppercase">
											Now
										</Text>
									</View>
								) : null}
							</View>
							<Text
								className={`font-semibold text-sm ${summary.currentUnit.status === "locked" ? "text-neutral-400" : "text-neutral-900"}`}
								numberOfLines={1}
							>
								{summary.currentUnit.title}
							</Text>
						</View>
					</View>

					<Row
						icon={
							<LessonIcon
								status={summary.currentLesson.status}
								type={lessonType(summary.currentLesson)}
							/>
						}
						title={summary.currentLesson.title}
						subtitle={
							summary.currentLesson.status === "locked"
								? getLessonLockLabel(summary.currentLesson.lockReason, "Locked")
								: summary.currentLesson.subtitle || "Current lesson"
						}
						active={summary.currentLesson.status === "current"}
						onPress={
							summary.currentLesson.status !== "locked"
								? () => openOnWeb(`/lesson/${summary.currentLesson.id}`)
								: undefined
						}
					/>

					{nextLesson ? (
						<Row
							icon={
								<LessonIcon
									status={nextLesson.status}
									type={lessonType(nextLesson)}
								/>
							}
							title={nextLesson.title}
							subtitle={
								nextLesson.status === "locked"
									? getLessonLockLabel(nextLesson.lockReason, "Next lesson")
									: nextLesson.subtitle || "Next lesson"
							}
							muted={nextLesson.status === "locked"}
							onPress={
								nextLesson.status !== "locked"
									? () => openOnWeb(`/lesson/${nextLesson.id}`)
									: undefined
							}
						/>
					) : nextUnit ? (
						<Row
							icon={
								<View className="size-7 items-center justify-center rounded-full border border-neutral-200 bg-white">
									<Ionicons
										name={
											nextUnit.status === "locked"
												? "lock-closed"
												: "arrow-forward"
										}
										size={12}
										color={nextUnit.status === "locked" ? "#d4d4d4" : "#a3a3a3"}
									/>
								</View>
							}
							title={nextUnit.title}
							subtitle={
								nextUnit.status === "locked"
									? nextUnit.unlockMessage || "Next unit"
									: "Continue to the next unit"
							}
							muted={nextUnit.status === "locked"}
							onPress={() => openOnWeb("/lessons")}
						/>
					) : null}
				</View>
			)}
		</Card>
	);
}
