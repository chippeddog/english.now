import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import ExercisePlayer from "@/components/lesson/exercise-player";
import LessonSummary from "@/components/lesson/lesson-summary";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_lesson/lesson/$lessonId")({
	component: LessonPage,
});

type Exercise = {
	id: string;
	type: "multiple_choice" | "fill_in_the_blank";
	prompt: string;
	options?: string[];
	correctAnswer: string;
	explanation: string;
	userAnswer?: string;
	isCorrect?: boolean;
};

type AnswerResult = {
	isCorrect: boolean;
	correctAnswer: string;
	explanation: string;
};

function LessonPage() {
	const { lessonId } = Route.useParams();
	const navigate = useNavigate();
	const trpc = useTRPC();

	const [attemptId, setAttemptId] = useState<string | null>(null);
	const [exercises, setExercises] = useState<Exercise[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [correctCount, setCorrectCount] = useState(0);
	const [totalCount, setTotalCount] = useState(0);
	const [phase, setPhase] = useState<"loading" | "playing" | "summary">(
		"loading",
	);
	const [finalScore, setFinalScore] = useState<number | null>(null);

	const startMutation = useMutation(
		trpc.content.startLesson.mutationOptions({
			onSuccess: (data) => {
				setAttemptId(data.attemptId);
				setExercises(data.exercises as Exercise[]);
				setCurrentIndex(data.currentIndex);
				setCorrectCount(data.correctCount);
				setTotalCount(data.totalCount);
				setPhase("playing");
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
		startMutation.mutate({ lessonId });
	}, [lessonId]);

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
		if (currentIndex + 1 >= totalCount) {
			if (attemptId) {
				completeMutation.mutate({ attemptId });
			}
		} else {
			setCurrentIndex((i) => i + 1);
		}
	}, [currentIndex, totalCount, attemptId, completeMutation]);

	const handleBackToLessons = useCallback(() => {
		navigate({ to: "/lessons" });
	}, [navigate]);

	if (phase === "loading") {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
				<p className="text-muted-foreground text-sm">
					Preparing your exercises...
				</p>
			</div>
		);
	}

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

	const currentExercise = exercises[currentIndex];
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
