import { useTranslation } from "@english.now/i18n";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Check, Languages, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

export type DrillItem = {
	id: string;
	sessionItemIndex: number;
	phase: "controlled" | "semi" | "freer";
	type: "multiple_choice";
	difficulty: "easy" | "medium" | "hard";
	prompt: string;
	instruction?: string;
	options?: string[];
	correctAnswer: string;
	hint?: string;
	ruleTitle: string;
	explanation: string;
	l1?: {
		prompt?: string;
		hint?: string;
		explanation?: string;
		instruction?: string;
	};
};

export type InitialAttempt = {
	itemIndex: number;
	userAnswer: string;
	isCorrect: boolean;
	hintUsed?: boolean;
};

type DrillPlayerProps = {
	sessionId: string;
	items: DrillItem[];
	initialAttempts: InitialAttempt[];
	translationEnabled?: boolean;
	onToggleTranslation?: () => void;
	onAfterAnswer?: (input: {
		item: DrillItem;
		feedback: FeedbackState;
	}) => Promise<void> | void;
	onComplete: () => void;
};

type FeedbackState = {
	itemIndex: number;
	isCorrect: boolean;
	correctAnswer: string;
	explanation: string | null;
	l1Explanation?: string | null;
	quality: number;
};

function getPromptParts(prompt: string) {
	const preferred = prompt.split("___");
	if (preferred.length > 1) {
		return preferred;
	}

	const legacy = prompt.split("_____");
	return legacy.length > 1 ? legacy : null;
}

function splitPrompt(prompt: string) {
	const separatorIndex = prompt.indexOf(":");
	if (separatorIndex === -1) {
		return { task: null, sentence: prompt.trim() };
	}

	return {
		task: prompt.slice(0, separatorIndex + 1).trim(),
		sentence: prompt.slice(separatorIndex + 1).trim(),
	};
}

function getBlankValues(answer: string, blankCount: number) {
	const parts = answer
		.split("/")
		.map((part) => part.trim())
		.filter(Boolean);

	return parts.length === blankCount ? parts : Array(blankCount).fill(answer);
}

export default function DrillPlayer({
	sessionId,
	items,
	initialAttempts,
	translationEnabled = false,
	onToggleTranslation,
	onAfterAnswer,
	onComplete,
}: DrillPlayerProps) {
	const trpc = useTRPC();
	const { t } = useTranslation("app");

	const initialIndex = useMemo(() => {
		const answered = new Set(initialAttempts.map((a) => a.itemIndex));
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			if (item && !answered.has(item.sessionItemIndex)) {
				return i;
			}
		}
		return Math.max(items.length - 1, 0);
	}, [initialAttempts, items]);

	const [currentIndex, setCurrentIndex] = useState(initialIndex);
	const [userAnswer, setUserAnswer] = useState("");
	const [feedback, setFeedback] = useState<FeedbackState | null>(null);
	const [correctCount, setCorrectCount] = useState(
		() => initialAttempts.filter((attempt) => attempt.isCorrect).length,
	);

	const submitAttempt = useMutation(
		trpc.grammar.submitAttempt.mutationOptions({
			onError: (err) => {
				toast.error(err.message || "Failed to submit answer");
			},
		}),
	);

	const completeSession = useMutation(
		trpc.grammar.completeSession.mutationOptions({
			onSuccess: () => {
				onComplete();
			},
			onError: (err) => {
				toast.error(err.message || "Failed to complete drill");
			},
		}),
	);

	const currentItem = items[currentIndex] ?? null;
	const isLastItem = currentIndex >= items.length - 1;
	const progressValue = Math.round(
		((currentIndex + 1) / Math.max(items.length, 1)) * 100,
	);

	const handleSelect = async (answer: string) => {
		if (!currentItem || feedback || submitAttempt.isPending) {
			return;
		}

		setUserAnswer(answer);

		const result = await submitAttempt.mutateAsync({
			sessionId,
			itemIndex: currentItem.sessionItemIndex,
			userAnswer: answer,
			hintUsed: false,
		});

		setFeedback({
			itemIndex: currentItem.sessionItemIndex,
			isCorrect: result.isCorrect,
			correctAnswer: result.correctAnswer,
			explanation: result.explanation,
			l1Explanation: result.l1Explanation,
			quality: result.quality ?? 1,
		});
		if (result.isCorrect) {
			setCorrectCount((prev) => prev + 1);
		}
	};

	const handleNext = async () => {
		if (currentItem && feedback && onAfterAnswer) {
			await onAfterAnswer({ item: currentItem, feedback });
		}

		setFeedback(null);
		setUserAnswer("");

		if (isLastItem) {
			await completeSession.mutateAsync({ sessionId });
			return;
		}

		setCurrentIndex((prev) => Math.min(prev + 1, items.length - 1));
	};

	if (!currentItem) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
				{t("grammar.noItems")}
			</div>
		);
	}

	const prompt = splitPrompt(currentItem.prompt);
	const promptParts = getPromptParts(prompt.sentence);
	const translatedPrompt =
		translationEnabled && currentItem.l1?.prompt
			? currentItem.l1.prompt
			: undefined;
	const displayedExplanation =
		translationEnabled && feedback?.l1Explanation
			? feedback.l1Explanation
			: feedback?.explanation;
	const blankAnswer = feedback
		? feedback.isCorrect
			? userAnswer
			: feedback.correctAnswer
		: "";
	const blankValues = promptParts
		? getBlankValues(blankAnswer, promptParts.length - 1)
		: [];

	return (
		<div className="container mx-auto max-w-3xl px-4 py-8">
			<div className="mb-2 flex items-center justify-between">
				<span className="font-medium text-muted-foreground text-sm">
					{currentIndex + 1} / {items.length}
				</span>
				<div className="flex items-center gap-3">
					{onToggleTranslation && currentItem.l1 ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={onToggleTranslation}
							className="h-8 rounded-full px-3 text-xs"
						>
							<Languages className="size-4" />
							{translationEnabled
								? t("grammar.translation.hide")
								: t("grammar.translation.show")}
						</Button>
					) : null}
					<span className="font-medium text-muted-foreground text-sm">
						{correctCount} correct
					</span>
				</div>
			</div>
			<div className="mb-8 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
				<div
					className="h-full rounded-full bg-blue-500 transition-all duration-500"
					style={{ width: `${progressValue}%` }}
				/>
			</div>

			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-white p-6">
					{prompt.task ? (
						<p className="text-muted-foreground text-sm leading-relaxed">
							{prompt.task}
						</p>
					) : null}

					{promptParts ? (
						<p className="text-balance font-bold text-lg leading-relaxed">
							{promptParts.map((part, index) => (
								<span
									key={`${currentItem.id}-${index === 0 ? "head" : index === promptParts.length - 1 ? "tail" : `mid-${index}`}`}
								>
									{part}
									{index < promptParts.length - 1 ? (
										<span
											className={cn(
												"mx-1 inline-block min-w-20 border-amber-300 border-b-2 px-2 py-0.5 text-center align-middle font-bold text-amber-700 text-lg",
												feedback &&
													(feedback.isCorrect
														? "border-lime-400 text-lime-700"
														: "border-red-400 text-red-700"),
											)}
										>
											{feedback ? blankValues[index] : ""}
										</span>
									) : null}
								</span>
							))}
						</p>
					) : (
						<p className="text-balance font-bold text-lg leading-relaxed">
							{prompt.sentence}
						</p>
					)}

					{translatedPrompt ? (
						<p className="mt-4 rounded-2xl bg-sky-50 px-4 py-3 text-sky-900 text-sm">
							{translatedPrompt}
						</p>
					) : null}
				</div>

				<div className="grid gap-3 md:grid-cols-2">
					{(currentItem.options ?? []).map((option, index) => {
						const isSelected = userAnswer === option;
						const isCorrectAnswer =
							feedback &&
							option.toLowerCase() === feedback.correctAnswer.toLowerCase();
						const isWrongSelection =
							feedback && isSelected && !feedback.isCorrect;

						return (
							<button
								key={option}
								type="button"
								disabled={Boolean(feedback) || submitAttempt.isPending}
								onClick={() => handleSelect(option)}
								style={
									isWrongSelection
										? {
												animation:
													"grammar-wrong-shake 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
											}
										: undefined
								}
								className={cn(
									"flex min-h-18 items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left font-medium transition-all",
									!feedback &&
										!isSelected &&
										"border-border/50 bg-white hover:border-blue-300 hover:bg-blue-50",
									!feedback && isSelected && "border-blue-500 bg-blue-50",
									isCorrectAnswer && "border-lime-500 bg-lime-50 text-lime-900",
									isWrongSelection && "border-red-400 bg-red-50 text-red-900",
									feedback &&
										!isCorrectAnswer &&
										!isWrongSelection &&
										"border-border/30 bg-neutral-50 text-muted-foreground opacity-60",
								)}
							>
								<span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 font-bold text-neutral-500 text-sm">
									{String.fromCharCode(65 + index)}
								</span>
								<span className="flex-1">{option}</span>
								{isCorrectAnswer ? (
									<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-lime-500 text-white">
										<Check className="size-3.5" strokeWidth={3} />
									</span>
								) : null}
								{isWrongSelection ? (
									<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-red-400 text-white">
										<X className="size-3.5" strokeWidth={3} />
									</span>
								) : null}
							</button>
						);
					})}
				</div>

				<style>
					{`
						@keyframes grammar-wrong-shake {
							0%, 100% { transform: translateX(0); }
							20% { transform: translateX(-1.5px); }
							40% { transform: translateX(2px); }
							60% { transform: translateX(-1px); }
							80% { transform: translateX(1px); }
						}
					`}
				</style>

				{feedback ? (
					<div
						className={cn(
							"rounded-2xl border p-4",
							feedback.isCorrect
								? "border-lime-200 bg-lime-50"
								: "border-red-200 bg-red-50",
						)}
					>
						<p
							className={cn(
								"mb-1 font-semibold text-sm",
								feedback.isCorrect ? "text-lime-800" : "text-red-800",
							)}
						>
							{feedback.isCorrect
								? t("grammar.correct")
								: t("grammar.notQuite")}
						</p>
						{!feedback.isCorrect ? (
							<p className="mb-2 text-red-900 text-sm">
								{t("grammar.yourAnswer")}{" "}
								<span className="font-medium line-through">
									{userAnswer || t("grammar.emptyAnswer")}
								</span>
								<br />
								{t("grammar.correctAnswer")}{" "}
								<span className="font-semibold">{feedback.correctAnswer}</span>
							</p>
						) : null}
						{displayedExplanation ? (
							<p
								className={cn(
									"text-sm",
									feedback.isCorrect ? "text-lime-700" : "text-red-700",
								)}
							>
								{displayedExplanation}
							</p>
						) : null}
					</div>
				) : null}

				{feedback ? (
					<div className="flex justify-end">
						<Button
							type="button"
							onClick={handleNext}
							disabled={completeSession.isPending}
							className="h-12 rounded-2xl bg-blue-600 px-8 font-semibold text-base hover:bg-blue-700"
						>
							{completeSession.isPending
								? t("grammar.finishing")
								: isLastItem
									? t("grammar.finishDrill")
									: t("grammar.next")}
							<ArrowRight className="ml-1 size-4" />
						</Button>
					</div>
				) : null}
			</div>
		</div>
	);
}
