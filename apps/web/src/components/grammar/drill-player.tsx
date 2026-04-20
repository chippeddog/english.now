import { useMutation } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

export type DrillItem = {
	id: string;
	prompt: string;
	answer: string;
	ruleTitle: string;
	explanation?: string;
};

export type InitialAttempt = {
	itemIndex: number;
	userAnswer: string;
	isCorrect: boolean;
};

type DrillPlayerProps = {
	sessionId: string;
	topicTitle: string;
	topicLevel: string | null;
	items: DrillItem[];
	initialAttempts: InitialAttempt[];
	onComplete: () => void;
};

type FeedbackState = {
	itemIndex: number;
	isCorrect: boolean;
	correctAnswer: string;
	explanation: string | null;
};

export default function DrillPlayer({
	sessionId,
	topicTitle,
	topicLevel,
	items,
	initialAttempts,
	onComplete,
}: DrillPlayerProps) {
	const trpc = useTRPC();

	const initialIndex = useMemo(() => {
		const answered = new Set(initialAttempts.map((a) => a.itemIndex));
		for (let i = 0; i < items.length; i++) {
			if (!answered.has(i)) return i;
		}
		return items.length - 1;
	}, [initialAttempts, items.length]);

	const [currentIndex, setCurrentIndex] = useState(initialIndex);
	const [userAnswer, setUserAnswer] = useState("");
	const [feedback, setFeedback] = useState<FeedbackState | null>(null);

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
		((currentIndex + (feedback ? 1 : 0)) / items.length) * 100,
	);

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		if (!currentItem || feedback || !userAnswer.trim()) {
			return;
		}

		const result = await submitAttempt.mutateAsync({
			sessionId,
			itemIndex: currentIndex,
			userAnswer: userAnswer.trim(),
		});

		setFeedback({
			itemIndex: currentIndex,
			isCorrect: result.isCorrect,
			correctAnswer: result.correctAnswer,
			explanation: result.explanation,
		});
	};

	const handleNext = async () => {
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
				No drill items available for this session.
			</div>
		);
	}

	const promptParts = currentItem.prompt.split("_____");

	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			<div className="mb-6 flex items-center justify-between">
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2">
						{topicLevel ? (
							<Badge
								variant={
									topicLevel as "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
								}
							>
								{topicLevel}
							</Badge>
						) : null}
						<span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
							{currentItem.ruleTitle}
						</span>
					</div>
					<h1 className="font-bold font-lyon text-2xl leading-tight">
						{topicTitle}
					</h1>
				</div>
				<div className="shrink-0 text-right">
					<p className="font-semibold text-sm">
						{currentIndex + 1}
						<span className="text-muted-foreground"> / {items.length}</span>
					</p>
					<p className="text-muted-foreground text-xs">Drill progress</p>
				</div>
			</div>

			<Progress value={progressValue} className="mb-8 h-2 bg-muted" />

			<div className="rounded-3xl border border-border/50 bg-white p-6 shadow-sm">
				<p className="mb-6 font-medium text-muted-foreground text-xs uppercase tracking-wider">
					Fill in the blank
				</p>
				<p className="text-balance font-lyon text-2xl leading-relaxed md:text-3xl">
					{promptParts.map((part, index) => (
						<span
							key={`${currentItem.id}-${index === 0 ? "head" : index === promptParts.length - 1 ? "tail" : `mid-${index}`}`}
						>
							{part}
							{index < promptParts.length - 1 ? (
								<span
									className={cn(
										"mx-1 inline-block min-w-24 rounded-lg border-2 border-dashed px-3 py-0.5 text-center align-middle font-semibold",
										feedback
											? feedback.isCorrect
												? "border-lime-400 bg-lime-50 text-lime-700"
												: "border-red-400 bg-red-50 text-red-700"
											: "border-border/80 bg-neutral-50 text-muted-foreground",
									)}
								>
									{feedback
										? feedback.isCorrect
											? userAnswer.trim()
											: feedback.correctAnswer
										: "_____"}
								</span>
							) : null}
						</span>
					))}
				</p>

				<form
					onSubmit={handleSubmit}
					className="mt-6 flex flex-col gap-3 sm:flex-row"
				>
					<Input
						autoFocus
						value={userAnswer}
						onChange={(event) => setUserAnswer(event.target.value)}
						placeholder="Type your answer"
						disabled={Boolean(feedback) || submitAttempt.isPending}
						className="h-12 rounded-xl bg-white text-base"
					/>
					{feedback ? (
						<Button
							type="button"
							onClick={handleNext}
							disabled={completeSession.isPending}
							className="h-12 rounded-xl"
						>
							{completeSession.isPending
								? "Finishing..."
								: isLastItem
									? "Finish drill"
									: "Next"}
							<ArrowRight className="size-4" />
						</Button>
					) : (
						<Button
							type="submit"
							disabled={!userAnswer.trim() || submitAttempt.isPending}
							className="h-12 rounded-xl"
						>
							{submitAttempt.isPending ? "Checking..." : "Check"}
						</Button>
					)}
				</form>

				{feedback ? (
					<div
						className={cn(
							"mt-5 flex gap-3 rounded-2xl border p-4",
							feedback.isCorrect
								? "border-lime-200 bg-lime-50"
								: "border-red-200 bg-red-50",
						)}
					>
						{feedback.isCorrect ? (
							<CheckCircle2 className="size-5 shrink-0 text-lime-600" />
						) : (
							<XCircle className="size-5 shrink-0 text-red-600" />
						)}
						<div className="flex min-w-0 flex-col gap-1">
							<p
								className={cn(
									"font-semibold text-sm",
									feedback.isCorrect ? "text-lime-800" : "text-red-800",
								)}
							>
								{feedback.isCorrect ? "Correct" : "Not quite"}
							</p>
							{!feedback.isCorrect ? (
								<p className="text-red-900 text-sm">
									Your answer:{" "}
									<span className="font-medium line-through">
										{userAnswer.trim() || "(empty)"}
									</span>
									<br />
									Correct answer:{" "}
									<span className="font-semibold">
										{feedback.correctAnswer}
									</span>
								</p>
							) : null}
							{feedback.explanation ? (
								<p
									className={cn(
										"text-sm",
										feedback.isCorrect ? "text-lime-900" : "text-red-900",
									)}
								>
									{feedback.explanation}
								</p>
							) : null}
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}
