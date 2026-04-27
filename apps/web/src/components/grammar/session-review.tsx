import { useTranslation } from "@english.now/i18n";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

export type ReviewAttempt = {
	id: string;
	itemIndex: number;
	prompt: string;
	userAnswer: string;
	expectedAnswer: string;
	isCorrect: boolean;
	hintUsed?: boolean;
	ruleTitle: string | null;
};

export type ReviewSummary = {
	totalItems: number;
	correctCount: number;
	incorrectCount: number;
	scorePercent: number;
	weakRules: string[];
	hintsUsed?: number;
	mistakeBankCount?: number;
};

type SessionReviewProps = {
	topicTitle: string;
	topicSlug: string | null;
	summary: ReviewSummary;
	attempts: ReviewAttempt[];
};

export default function SessionReview({
	topicTitle,
	topicSlug,
	summary,
	attempts,
}: SessionReviewProps) {
	const trpc = useTRPC();
	const navigate = useNavigate();
	const { t } = useTranslation("app");

	const startDrill = useMutation(
		trpc.grammar.startDrillSession.mutationOptions({
			onSuccess: ({ sessionId }) => {
				navigate({
					to: "/grammar/$sessionId",
					params: { sessionId },
				});
			},
			onError: (err) => {
				toast.error(err.message || "Failed to start drill");
			},
		}),
	);

	const sorted = [...attempts].sort((a, b) => a.itemIndex - b.itemIndex);
	const scoreColor =
		summary.scorePercent >= 80
			? "text-lime-700"
			: summary.scorePercent >= 50
				? "text-amber-700"
				: "text-red-700";

	return (
		<div>
			<div className="rounded-3xl border border-border/50 bg-white p-6 shadow-sm">
				<div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
					<div>
						<p className="text-muted-foreground text-sm uppercase tracking-wider">
							{t("grammar.review.complete")}
						</p>
						<h1 className="mt-1 font-bold font-lyon text-3xl">{topicTitle}</h1>
					</div>
					<div className="flex items-center gap-6">
						<div className="text-right">
							<p
								className={cn(
									"font-bold font-lyon text-5xl leading-none",
									scoreColor,
								)}
							>
								{summary.scorePercent}%
							</p>
							<p className="mt-1 text-muted-foreground text-sm">
								{summary.correctCount} / {summary.totalItems} correct
							</p>
						</div>
					</div>
				</div>

				{summary.weakRules.length > 0 ? (
					<div className="mt-6 rounded-2xl bg-neutral-50 p-4">
						<p className="mb-2 font-medium text-sm">
							{t("grammar.review.focusNext")}
						</p>
						<div className="flex flex-wrap gap-2">
							{summary.weakRules.map((rule) => (
								<Badge key={rule} variant="secondary">
									{rule}
								</Badge>
							))}
						</div>
					</div>
				) : null}

				{summary.mistakeBankCount ? (
					<div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
						<div className="flex items-center gap-2">
							<Sparkles className="size-4 text-amber-700" />
							<p className="font-medium text-amber-900">
								{t("grammar.review.bank")}
							</p>
						</div>
						<p className="mt-2 text-amber-950 text-sm">
							{t("grammar.review.bankAdded", {
								count: summary.mistakeBankCount,
							})}
						</p>
					</div>
				) : null}

				<div className="mt-6 flex flex-wrap gap-2">
					{topicSlug ? (
						<Link
							to="/practice/grammar/$slug"
							params={{ slug: topicSlug }}
							className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-4 font-medium text-sm transition-colors hover:bg-neutral-50"
						>
							<ChevronLeft className="size-4" />
							{t("grammar.review.backToTopic")}
						</Link>
					) : null}
					<Button
						type="button"
						onClick={() => {
							const firstAttempt = sorted[0];
							const topicId = firstAttempt
								? (firstAttempt as unknown as { grammarTopicId?: string })
										.grammarTopicId
								: null;
							if (topicSlug) {
								startDrill.mutate({ topicId: topicSlug });
							} else if (topicId) {
								startDrill.mutate({ topicId });
							}
						}}
						disabled={startDrill.isPending || !topicSlug}
						className="h-10 rounded-xl"
					>
						<RotateCcw className="size-4" />
						{startDrill.isPending
							? t("grammar.starting")
							: t("grammar.review.practiceAgain")}
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate({ to: "/grammar/review" })}
						className="h-10 rounded-xl"
					>
						<Sparkles className="size-4" />
						{t("grammar.review.bank")}
					</Button>
				</div>
			</div>

			<div className="mt-6">
				<h2 className="mb-3 font-semibold">{t("grammar.review.answers")}</h2>
				<div className="flex flex-col gap-3">
					{sorted.map((attempt) => (
						<div
							key={attempt.id}
							className={cn(
								"rounded-2xl border bg-white p-4",
								attempt.isCorrect
									? "border-lime-200"
									: "border-red-200 bg-red-50/30",
							)}
						>
							<div className="mb-2 flex items-center justify-between gap-2">
								<span className="text-muted-foreground text-xs">
									{t("grammar.review.questionNumber", {
										count: attempt.itemIndex + 1,
									})}
									{attempt.ruleTitle ? ` · ${attempt.ruleTitle}` : ""}
								</span>
								<Badge
									variant={attempt.isCorrect ? "mastered" : "outline"}
									className={
										attempt.isCorrect
											? ""
											: "border-red-300 bg-red-100 text-red-700"
									}
								>
									{attempt.isCorrect
										? t("grammar.correct")
										: t("grammar.review.incorrect")}
								</Badge>
							</div>
							<p className="text-base">
								{attempt.prompt.replace("_____", "___")}
							</p>
							<div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
								<span>
									<span className="text-muted-foreground">
										{t("grammar.yourAnswer")}{" "}
									</span>
									<span
										className={cn(
											"font-medium",
											attempt.isCorrect ? "text-lime-700" : "text-red-700",
										)}
									>
										{attempt.userAnswer || t("grammar.emptyAnswer")}
									</span>
								</span>
								{!attempt.isCorrect ? (
									<span>
										<span className="text-muted-foreground">
											{t("grammar.correctAnswer")}{" "}
										</span>
										<span className="font-medium text-lime-700">
											{attempt.expectedAnswer}
										</span>
									</span>
								) : null}
								{attempt.hintUsed ? (
									<Badge variant="outline">
										{t("grammar.review.hintUsed")}
									</Badge>
								) : null}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
