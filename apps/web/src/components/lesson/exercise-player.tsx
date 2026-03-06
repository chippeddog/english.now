import type { ExerciseItem } from "@/types/lesson";
import { ArrowRight } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Categorization from "./exercises/categorization";
import Dictation from "./exercises/dictation";
import ErrorIdentification from "./exercises/error-identification";
import ReorderWords from "./exercises/reorder-words";
import SentenceBuilding from "./exercises/sentence-building";
import SentenceCorrection from "./exercises/sentence-correction";
import TrueFalse from "./exercises/true-false";
import WordMatching from "./exercises/word-matching";
import FillInTheBlank from "./fill-in-the-blank";
import MultipleChoice from "./multiple-choice";

type AnswerResult = {
	isCorrect: boolean;
	correctAnswer: string;
	explanation: string;
};

interface ExercisePlayerProps {
	exercise: ExerciseItem;
	currentIndex: number;
	totalCount: number;
	correctCount: number;
	onAnswer: (exerciseId: string, answer: string) => Promise<AnswerResult>;
	onNext: () => void;
}

const EXERCISE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
	multiple_choice: { label: "Choose the correct answer", color: "bg-violet-100 text-violet-700" },
	fill_in_the_blank: { label: "Fill in the blank", color: "bg-sky-100 text-sky-700" },
	sentence_correction: { label: "Correct the sentence", color: "bg-amber-100 text-amber-700" },
	sentence_transformation: { label: "Transform the sentence", color: "bg-amber-100 text-amber-700" },
	reorder_words: { label: "Reorder the words", color: "bg-indigo-100 text-indigo-700" },
	error_identification: { label: "Find the error", color: "bg-amber-100 text-amber-700" },
	word_matching: { label: "Match the pairs", color: "bg-sky-100 text-sky-700" },
	synonym_antonym: { label: "Synonyms & Antonyms", color: "bg-sky-100 text-sky-700" },
	categorization: { label: "Sort into categories", color: "bg-teal-100 text-teal-700" },
	true_false: { label: "True or False", color: "bg-emerald-100 text-emerald-700" },
	comprehension: { label: "Comprehension", color: "bg-emerald-100 text-emerald-700" },
	dictation: { label: "Listen and type", color: "bg-amber-100 text-amber-700" },
	dialogue_completion: { label: "Complete the dialogue", color: "bg-rose-100 text-rose-700" },
	sentence_building: { label: "Build a sentence", color: "bg-indigo-100 text-indigo-700" },
	error_correction: { label: "Correct the error", color: "bg-amber-100 text-amber-700" },
};

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

	const typeConfig = EXERCISE_TYPE_LABELS[exercise.type] ?? {
		label: exercise.type,
		color: "bg-neutral-100 text-neutral-700",
	};

	const exerciseResult = result
		? {
				isCorrect: result.isCorrect,
				correctAnswer: result.correctAnswer,
				explanation: result.explanation,
			}
		: undefined;

	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			{/* Progress bar */}
			<div className="mb-2 flex items-center justify-between">
				<span className="font-medium text-muted-foreground text-sm">
					{currentIndex + 1} / {totalCount}
				</span>
				<div className="flex items-center gap-3">
					{exercise.phase === "guided" && (
						<span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-600 text-xs">
							Guided
						</span>
					)}
					<span className="font-medium text-muted-foreground text-sm">
						{correctCount} correct
					</span>
				</div>
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
						typeConfig.color,
					)}
				>
					{exercise.instruction ?? typeConfig.label}
				</span>
			</div>

			{/* Exercise content */}
			{renderExercise(exercise, handleAnswer, submitting, exerciseResult)}

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

function renderExercise(
	exercise: ExerciseItem,
	onSubmit: (answer: string) => void,
	disabled: boolean,
	result?: { isCorrect: boolean; correctAnswer: string; explanation: string },
) {
	const hint = exercise.phase === "guided" ? exercise.hint : undefined;
	const resultWithCorrect = result
		? { ...result, correctAnswer: result.correctAnswer as string | string[] }
		: undefined;

	switch (exercise.type) {
		case "multiple_choice":
		case "comprehension":
		case "synonym_antonym":
		case "dialogue_completion":
			return (
				<MultipleChoice
					key={exercise.id}
					prompt={exercise.prompt}
					options={exercise.options ?? []}
					onSubmit={onSubmit}
					disabled={disabled}
					result={result}
				/>
			);

		case "fill_in_the_blank":
		case "sentence_transformation":
			return (
				<FillInTheBlank
					key={exercise.id}
					prompt={exercise.prompt}
					onSubmit={onSubmit}
					disabled={disabled}
					result={result}
				/>
			);

		case "reorder_words":
			return (
				<ReorderWords
					key={exercise.id}
					prompt={exercise.prompt}
					items={exercise.items ?? []}
					onSubmit={onSubmit}
					disabled={disabled}
					hint={hint}
					result={resultWithCorrect}
				/>
			);

		case "sentence_correction":
		case "error_correction":
			return (
				<SentenceCorrection
					key={exercise.id}
					prompt={exercise.prompt}
					onSubmit={onSubmit}
					disabled={disabled}
					hint={hint}
					result={resultWithCorrect}
				/>
			);

		case "word_matching":
			return (
				<WordMatching
					key={exercise.id}
					prompt={exercise.prompt}
					pairs={exercise.pairs ?? []}
					onSubmit={onSubmit}
					disabled={disabled}
					hint={hint}
					result={resultWithCorrect}
				/>
			);

		case "true_false":
			return (
				<TrueFalse
					key={exercise.id}
					prompt={exercise.prompt}
					onSubmit={onSubmit}
					disabled={disabled}
					hint={hint}
					result={resultWithCorrect}
				/>
			);

		case "dictation":
			return (
				<Dictation
					key={exercise.id}
					prompt={exercise.prompt}
					onSubmit={onSubmit}
					disabled={disabled}
					hint={hint}
					result={resultWithCorrect}
				/>
			);

		case "error_identification":
			return (
				<ErrorIdentification
					key={exercise.id}
					prompt={exercise.prompt}
					options={exercise.options ?? []}
					onSubmit={onSubmit}
					disabled={disabled}
					hint={hint}
					result={resultWithCorrect}
				/>
			);

		case "sentence_building":
			return (
				<SentenceBuilding
					key={exercise.id}
					prompt={exercise.prompt}
					items={exercise.items}
					onSubmit={onSubmit}
					disabled={disabled}
					hint={hint}
					result={resultWithCorrect}
				/>
			);

		case "categorization":
			return (
				<Categorization
					key={exercise.id}
					prompt={exercise.prompt}
					categories={exercise.categories ?? []}
					items={exercise.items ?? []}
					onSubmit={onSubmit}
					disabled={disabled}
					hint={hint}
					result={resultWithCorrect}
				/>
			);

		default:
			return (
				<FillInTheBlank
					key={exercise.id}
					prompt={exercise.prompt}
					onSubmit={onSubmit}
					disabled={disabled}
					result={result}
				/>
			);
	}
}
