import { ArrowRight } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import FillInTheBlank from "./fill-in-the-blank";
import MultipleChoice from "./multiple-choice";

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

interface ExercisePlayerProps {
	exercise: Exercise;
	currentIndex: number;
	totalCount: number;
	correctCount: number;
	onAnswer: (exerciseId: string, answer: string) => Promise<AnswerResult>;
	onNext: () => void;
}

export default function ExercisePlayer({
	exercise,
	currentIndex,
	totalCount,
	correctCount,
	onAnswer,
	onNext,
}: ExercisePlayerProps) {
	const [result, setResult] = useState<AnswerResult | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const progress = ((currentIndex + 1) / totalCount) * 100;
	const isLast = currentIndex + 1 >= totalCount;

	const handleAnswer = useCallback(
		async (answer: string) => {
			if (submitting || result) return;
			setSubmitting(true);
			try {
				const res = await onAnswer(exercise.id, answer);
				setResult(res);
			} finally {
				setSubmitting(false);
			}
		},
		[exercise.id, onAnswer, submitting, result],
	);

	const handleNext = useCallback(() => {
		setResult(null);
		onNext();
	}, [onNext]);

	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			{/* Progress bar */}
			<div className="mb-2 flex items-center justify-between">
				<span className="font-medium text-muted-foreground text-sm">
					{currentIndex + 1} / {totalCount}
				</span>
				<span className="font-medium text-muted-foreground text-sm">
					{correctCount} correct
				</span>
			</div>
			<div className="mb-8 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
				<div
					className="h-full rounded-full bg-blue-500 transition-all duration-500"
					style={{ width: `${progress}%` }}
				/>
			</div>

			{/* Exercise type label */}
			<div className="mb-4">
				<span
					className={cn(
						"inline-block rounded-full px-3 py-1 font-medium text-xs",
						exercise.type === "multiple_choice"
							? "bg-violet-100 text-violet-700"
							: "bg-sky-100 text-sky-700",
					)}
				>
					{exercise.type === "multiple_choice"
						? "Choose the correct answer"
						: "Fill in the blank"}
				</span>
			</div>

			{/* Exercise content */}
			{exercise.type === "multiple_choice" && exercise.options ? (
				<MultipleChoice
					key={exercise.id}
					prompt={exercise.prompt}
					options={exercise.options}
					onSubmit={handleAnswer}
					disabled={submitting}
					result={result ?? undefined}
				/>
			) : (
				<FillInTheBlank
					key={exercise.id}
					prompt={exercise.prompt}
					onSubmit={handleAnswer}
					disabled={submitting}
					result={result ?? undefined}
				/>
			)}

			{/* Continue button */}
			{result && (
				<div className="mt-6 flex justify-end">
					<Button
						onClick={handleNext}
						className="h-12 rounded-2xl bg-blue-600 px-8 font-semibold text-base hover:bg-blue-700"
					>
						{isLast ? "See Results" : "Continue"}
						<ArrowRight className="ml-1 size-4" />
					</Button>
				</div>
			)}
		</div>
	);
}
