import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Loader, Sparkles, Target } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUpgradeDialog } from "@/components/dashboard/upgrade-dialog";
import ExercisePlayer from "@/components/lesson/exercise-player";
import LessonSummary from "@/components/lesson/lesson-summary";
import { useLessonReportIssue } from "@/components/lesson/report-issue-context";
import TheoryView from "@/components/lesson/theory";
import GrammarTheory from "@/components/lesson/theory/grammar-theory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePracticeTimer } from "@/hooks/use-practice-timer";
import type {
	CurriculumLessonContent,
	ExerciseItem,
	GrammarLessonContent,
} from "@/types/lesson";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_lesson/lesson/$lessonId")({
	component: LessonPage,
});

type AnswerResult = {
	isCorrect: boolean;
	correctAnswer: string;
	explanation: string;
};

type LessonPhase =
	| "loading"
	| "intro"
	| "theory"
	| "guided_practice"
	| "free_practice"
	| "summary";

function LessonPage() {
	const { lessonId } = Route.useParams();
	const navigate = useNavigate();
	const trpc = useTRPC();
	const { getElapsedSeconds } = usePracticeTimer();
	const { openDialog } = useUpgradeDialog();
	const { setAttemptId: setNavbarAttemptId } = useLessonReportIssue();

	const [attemptId, setAttemptId] = useState<string | null>(null);
	const [exercises, setExercises] = useState<ExerciseItem[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [correctCount, setCorrectCount] = useState(0);
	const [totalCount, setTotalCount] = useState(0);
	const [phase, setPhase] = useState<LessonPhase>("loading");
	const [finalScore, setFinalScore] = useState<number | null>(null);

	const { data: lessonData, error: lessonError } = useQuery(
		trpc.content.getLesson.queryOptions({ lessonId }),
	);

	const lessonContent = lessonData?.content as CurriculumLessonContent | null;
	const hasTheory = !!lessonContent?.type;
	const linkedGrammarTopics = lessonData?.grammarTopics ?? [];
	const primaryGrammarTopic = useMemo(
		() =>
			linkedGrammarTopics.find((topic) => topic.kind === "teach") ??
			linkedGrammarTopics[0] ??
			null,
		[linkedGrammarTopics],
	);
	const {
		data: primaryGrammarTopicDetail,
		isLoading: isPrimaryGrammarTopicLoading,
	} = useQuery({
		...trpc.grammar.getTopic.queryOptions({
			topicId: primaryGrammarTopic?.id ?? "",
		}),
		enabled: Boolean(primaryGrammarTopic?.id),
	});
	const canonicalGrammarContent = useMemo<GrammarLessonContent | null>(() => {
		if (!primaryGrammarTopicDetail?.content) {
			return null;
		}

		return {
			type: "grammar",
			description: primaryGrammarTopicDetail.content.description,
			objectives: primaryGrammarTopicDetail.content.objectives,
			rules: primaryGrammarTopicDetail.content.rules,
			vocabulary: primaryGrammarTopicDetail.content.vocabulary,
		};
	}, [primaryGrammarTopicDetail]);

	const guidedExercises = useMemo(
		() => exercises.filter((e) => e.phase === "guided"),
		[exercises],
	);
	const freeExercises = useMemo(
		() => exercises.filter((e) => e.phase === "free"),
		[exercises],
	);

	const currentPhaseExercises =
		phase === "guided_practice" ? guidedExercises : freeExercises;
	const phaseOffset = phase === "free_practice" ? guidedExercises.length : 0;
	const localIndex = currentIndex - phaseOffset;

	const startMutation = useMutation(
		trpc.content.startLesson.mutationOptions({
			onSuccess: (data) => {
				setAttemptId(data.attemptId);
				setExercises(data.exercises as ExerciseItem[]);
				setCurrentIndex(data.currentIndex);
				setCorrectCount(data.correctCount);
				setTotalCount(data.totalCount);

				if (hasTheory) {
					setPhase("intro");
				} else {
					setPhase("guided_practice");
				}
			},
			onError: () => {
				openDialog();
				navigate({ to: "/lessons" });
			},
		}),
	);

	const submitMutation = useMutation(
		trpc.content.submitAnswer.mutationOptions({}),
	);

	const completeMutation = useMutation(
		trpc.content.completeLesson.mutationOptions({
			onSuccess: (data) => {
				setFinalScore(data.score);
				setCorrectCount(data.correctCount);
				setTotalCount(data.totalCount);
				setPhase("summary");
			},
		}),
	);

	useEffect(() => {
		if (lessonError) {
			openDialog();
			navigate({ to: "/lessons" });
		}
	}, [lessonError, navigate, openDialog]);

	useEffect(() => {
		if (!lessonData) return;
		// Guard against double-start: once we already have an attempt id for
		// this lesson, or the mutation is currently in flight, don't fire again.
		if (attemptId) return;
		if (startMutation.isPending) return;
		startMutation.mutate({ lessonId });
	}, [lessonData, lessonId, attemptId, startMutation.isPending, startMutation]);

	useEffect(() => {
		setNavbarAttemptId(attemptId);

		return () => {
			setNavbarAttemptId(null);
		};
	}, [attemptId, setNavbarAttemptId]);

	const handleAnswer = useCallback(
		async (exerciseId: string, answer: string): Promise<AnswerResult> => {
			if (!attemptId) throw new Error("No attempt");

			const result = await submitMutation.mutateAsync({
				attemptId,
				exerciseId,
				answer,
			});

			setExercises((prev) =>
				prev.map((ex) =>
					ex.id === exerciseId
						? {
								...ex,
								userAnswer: answer,
								isCorrect: result.isCorrect,
								correctAnswer: result.correctAnswer,
								explanation: result.explanation,
							}
						: ex,
				),
			);

			if (result.isCorrect) {
				setCorrectCount((c) => c + 1);
			}

			return result;
		},
		[attemptId, submitMutation],
	);

	const handleNext = useCallback(() => {
		const nextIndex = currentIndex + 1;

		if (nextIndex >= totalCount) {
			if (attemptId) {
				completeMutation.mutate({
					attemptId,
					durationSeconds: getElapsedSeconds(),
				});
			}
			return;
		}

		setCurrentIndex(nextIndex);

		if (
			phase === "guided_practice" &&
			nextIndex >= guidedExercises.length &&
			freeExercises.length > 0
		) {
			setPhase("free_practice");
		}
	}, [
		currentIndex,
		totalCount,
		attemptId,
		completeMutation,
		getElapsedSeconds,
		phase,
		guidedExercises.length,
		freeExercises.length,
	]);

	const handleBackToLessons = useCallback(() => {
		navigate({ to: "/lessons" });
	}, [navigate]);
	const handleOpenGrammarTopic = useCallback(
		(topicSlug: string) => {
			navigate({
				to: "/practice/grammar/$slug",
				params: { slug: topicSlug },
			});
		},
		[navigate],
	);

	// ─── Loading ──────────────────────────────────────────────────────────────

	if (phase === "loading") {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
				<div className="flex flex-col items-center gap-4">
					<Loader className="size-7 animate-spin text-lime-600" />
					<p className="font-medium text-foreground-muted">
						Preparing your lesson...
					</p>
				</div>
			</div>
		);
	}

	// ─── Intro ────────────────────────────────────────────────────────────────

	if (phase === "intro" && lessonContent) {
		return (
			<div className="container mx-auto max-w-3xl px-4 py-8">
				<div className="flex flex-col items-center gap-6 text-center">
					<div className="flex size-16 items-center justify-center rounded-full bg-blue-100">
						<BookOpen className="size-8 text-blue-600" />
					</div>

					<div>
						{lessonData?.level && (
							<div className="mb-3 flex justify-center">
								<Badge variant={lessonData.level}>{lessonData.level}</Badge>
							</div>
						)}
						<h1 className="mb-2 font-bold font-lyon text-3xl">
							{lessonData?.title}
						</h1>
						{lessonData?.subtitle && (
							<p className="text-lg text-muted-foreground">
								{lessonData.subtitle}
							</p>
						)}
					</div>

					<p className="max-w-md text-neutral-600 leading-relaxed">
						{lessonContent.description}
					</p>

					{primaryGrammarTopic && (
						<div className="w-full max-w-md rounded-2xl border border-border/50 bg-white p-5 text-left">
							<div className="mb-3 flex items-start justify-between gap-3">
								<div className="flex items-center gap-2">
									<Sparkles className="size-4 text-violet-600" />
									<h3 className="font-semibold text-sm">Canonical topic</h3>
								</div>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										handleOpenGrammarTopic(primaryGrammarTopic.slug)
									}
									className="rounded-xl"
								>
									Open in Grammar
								</Button>
							</div>
							<div className="mb-3 flex flex-wrap items-center gap-2">
								<Badge variant={primaryGrammarTopic.cefrLevel}>
									{primaryGrammarTopic.cefrLevel}
								</Badge>
								<Badge variant="secondary" className="capitalize">
									{primaryGrammarTopic.kind}
								</Badge>
							</div>
							<h3 className="font-semibold text-lg">
								{primaryGrammarTopicDetail?.title ?? primaryGrammarTopic.title}
							</h3>
							{isPrimaryGrammarTopicLoading && !primaryGrammarTopicDetail ? (
								<div className="mt-2 space-y-2">
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-[88%]" />
								</div>
							) : (
								<p className="mt-2 text-neutral-700 text-sm leading-relaxed">
									{primaryGrammarTopicDetail?.summary ??
										primaryGrammarTopic.summary}
								</p>
							)}
							<p className="mt-3 text-muted-foreground text-xs leading-relaxed">
								This lesson is a guided path through the canonical grammar
								library, so you can always jump back to the topic for review,
								related concepts, and future practice.
							</p>
						</div>
					)}

					{lessonContent.objectives.length > 0 && (
						<div className="w-full max-w-md rounded-2xl border border-border/50 bg-white p-5 text-left">
							<div className="mb-3 flex items-center gap-2">
								<Target className="size-4 text-blue-600" />
								<h3 className="font-semibold text-sm">What you'll learn</h3>
							</div>
							<ul className="flex flex-col gap-2">
								{lessonContent.objectives.map((obj) => (
									<li
										key={obj}
										className="flex items-start gap-2 text-neutral-700 text-sm"
									>
										<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-400" />
										{obj}
									</li>
								))}
							</ul>
						</div>
					)}

					{linkedGrammarTopics.length > 0 && (
						<div className="w-full max-w-md rounded-2xl border border-border/50 bg-white p-5 text-left">
							<div className="mb-3 flex items-center gap-2">
								<BookOpen className="size-4 text-violet-600" />
								<h3 className="font-semibold text-sm">
									Grammar topics in this lesson
								</h3>
							</div>
							<div className="flex flex-col gap-2">
								{linkedGrammarTopics.map((topic) => (
									<button
										key={topic.id}
										type="button"
										onClick={() => handleOpenGrammarTopic(topic.slug)}
										className="flex items-center justify-between rounded-xl border border-border/50 px-3 py-2 text-left transition-colors hover:bg-muted/40"
									>
										<div>
											<p className="font-medium text-sm">{topic.title}</p>
											<p className="text-muted-foreground text-xs">
												{topic.category} · {topic.kind}
											</p>
										</div>
										<ArrowRight className="size-4 text-muted-foreground" />
									</button>
								))}
							</div>
						</div>
					)}

					<button
						type="button"
						onClick={() => setPhase("theory")}
						className="flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-8 font-semibold text-base text-white transition-colors hover:bg-blue-700"
					>
						Start Learning
						<ArrowRight className="size-4" />
					</button>
				</div>
			</div>
		);
	}

	// ─── Theory ───────────────────────────────────────────────────────────────

	if (phase === "theory" && lessonContent) {
		if (
			lessonContent.type === "grammar" &&
			primaryGrammarTopic &&
			isPrimaryGrammarTopicLoading &&
			!canonicalGrammarContent
		) {
			return (
				<div className="container mx-auto max-w-2xl px-4 py-8">
					<Skeleton className="mb-3 h-6 w-32" />
					<Skeleton className="mb-3 h-10 w-72" />
					<Skeleton className="mb-8 h-5 w-full" />
					<Skeleton className="mb-4 h-48 rounded-2xl" />
					<Skeleton className="h-48 rounded-2xl" />
				</div>
			);
		}

		if (
			lessonContent.type === "grammar" &&
			primaryGrammarTopic &&
			canonicalGrammarContent
		) {
			return (
				<GrammarTheory
					content={canonicalGrammarContent}
					title={primaryGrammarTopicDetail?.title ?? primaryGrammarTopic.title}
					description={
						primaryGrammarTopicDetail?.summary ??
						canonicalGrammarContent.description
					}
					badgeLabel="Canonical Grammar Topic"
					headerSlot={
						<div className="mb-6 rounded-2xl border border-border/50 bg-white p-4">
							<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
								<div>
									<div className="mb-2 flex flex-wrap items-center gap-2">
										<Badge variant={primaryGrammarTopic.cefrLevel}>
											{primaryGrammarTopic.cefrLevel}
										</Badge>
										<Badge variant="secondary" className="capitalize">
											{primaryGrammarTopic.kind}
										</Badge>
									</div>
									<p className="text-muted-foreground text-sm leading-relaxed">
										This lesson uses the canonical topic as the source of truth
										and turns it into a guided practice sequence.
									</p>
								</div>
								<Button
									type="button"
									variant="outline"
									onClick={() =>
										handleOpenGrammarTopic(primaryGrammarTopic.slug)
									}
									className="rounded-xl"
								>
									Open in Grammar
								</Button>
							</div>
						</div>
					}
					onContinue={() => {
						if (guidedExercises.length > 0) {
							setPhase("guided_practice");
						} else if (freeExercises.length > 0) {
							setCurrentIndex(guidedExercises.length);
							setPhase("free_practice");
						} else {
							setPhase("summary");
						}
					}}
				/>
			);
		}

		return (
			<TheoryView
				content={lessonContent}
				onContinue={() => {
					if (guidedExercises.length > 0) {
						setPhase("guided_practice");
					} else if (freeExercises.length > 0) {
						setCurrentIndex(guidedExercises.length);
						setPhase("free_practice");
					} else {
						setPhase("summary");
					}
				}}
			/>
		);
	}

	// ─── Summary ──────────────────────────────────────────────────────────────

	if (phase === "summary") {
		return (
			<LessonSummary
				score={finalScore ?? 0}
				correctCount={correctCount}
				totalCount={totalCount}
				exercises={exercises}
				onBack={handleBackToLessons}
			/>
		);
	}

	// ─── Practice (guided or free) ────────────────────────────────────────────

	const currentExercise = currentPhaseExercises[localIndex];
	if (!currentExercise) return null;

	return (
		<ExercisePlayer
			exercise={currentExercise}
			currentIndex={currentIndex}
			totalCount={totalCount}
			correctCount={correctCount}
			onAnswer={handleAnswer}
			onNext={handleNext}
		/>
	);
}
