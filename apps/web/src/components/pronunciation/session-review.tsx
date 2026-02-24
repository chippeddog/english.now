import { env } from "@english.now/env/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowUpRight,
	BookOpen,
	ChevronLeft,
	Lightbulb,
	Loader2,
	RefreshCw,
	Sparkles,
	Star,
	Target,
} from "lucide-react";
import { useEffect } from "react";
import { OverallScore, ScoreBreakdown } from "@/components/pronunciation/score";
import WeakPhonemesSection from "@/components/pronunciation/weak-phonemes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

type WeakPhoneme = {
	phoneme: string;
	score: number;
	occurrences: number;
	exampleWords: string[];
};

type SessionSummary = {
	averageScore: number;
	averageAccuracy: number;
	averageFluency: number;
	averageProsody: number;
	averageCompleteness: number;
	totalAttempts: number;
	bestScore: number;
	worstScore: number;
	weakWords: string[];
	weakPhonemes: WeakPhoneme[];
};

type PracticeSuggestion = {
	type: "phoneme" | "word" | "pattern" | "fluency";
	title: string;
	description: string;
	examples: string[];
	priority: "high" | "medium" | "low";
};

type PronunciationFeedback = {
	overallAnalysis: string;
	strengths: string[];
	areasToImprove: string[];
	suggestions: PracticeSuggestion[];
	recommendedLevel: string;
	nextSteps: string;
};

const PRIORITY_STYLES: Record<string, string> = {
	high: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20",
	medium:
		"border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20",
	low: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20",
};

const SUGGESTION_ICONS: Record<string, typeof Target> = {
	phoneme: Target,
	word: BookOpen,
	pattern: Lightbulb,
	fluency: Sparkles,
};

export default function SessionReview({
	summary,
	sessionId,
	cefrLevel,
}: {
	summary: SessionSummary;
	sessionId: string;
	cefrLevel: string;
}) {
	const navigate = useNavigate();
	const trpc = useTRPC();

	const {
		data: feedbackData,
		isLoading: isFeedbackLoading,
		refetch,
	} = useQuery({
		...trpc.pronunciation.getFeedback.queryOptions({ sessionId }),
		refetchInterval: (query) => {
			const status = query.state.data?.status;
			if (status === "completed" || status === "failed") return false;
			return 3000;
		},
	});

	useEffect(() => {
		if (!feedbackData) return;
		if (
			feedbackData.status === "completed" ||
			feedbackData.status === "processing"
		)
			return;

		async function enqueueFeedback() {
			try {
				await fetch(
					`${env.VITE_SERVER_URL}/api/pronunciation/enqueue-feedback`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						credentials: "include",
						body: JSON.stringify({ sessionId }),
					},
				);
			} catch (err) {
				console.error("Failed to enqueue feedback:", err);
			}
		}
		enqueueFeedback();
	}, [sessionId, feedbackData]);

	const feedback = feedbackData?.feedback as PronunciationFeedback | null;
	const feedbackStatus = feedbackData?.status;

	return (
		<div className="space-y-6">
			{/* {summary.paragraph && (
				<div className="rounded-2xl border bg-card p-8">
					<p className="text-foreground leading-relaxed">{summary.paragraph}</p>
				</div>
			)} */}
			{/* Scores */}
			<div className="rounded-2xl border bg-card p-8">
				<OverallScore score={summary.averageScore} />

				{(summary.averageAccuracy > 0 ||
					summary.averageFluency > 0 ||
					summary.averageProsody > 0 ||
					summary.averageCompleteness > 0) && (
					<div className="mt-6 border-t pt-6">
						<ScoreBreakdown
							accuracy={summary.averageAccuracy}
							fluency={summary.averageFluency}
							completeness={summary.averageCompleteness}
							prosody={summary.averageProsody}
						/>
					</div>
				)}

				<div className="mt-6 grid grid-cols-3 gap-4 border-t pt-6">
					<div className="text-center">
						<p className="font-bold text-2xl text-green-600">
							{summary.bestScore}%
						</p>
						<p className="text-muted-foreground text-sm">Best Score</p>
					</div>
					<div className="text-center">
						<p className="font-bold text-2xl">{summary.totalAttempts}</p>
						<p className="text-muted-foreground text-sm">Attempts</p>
					</div>
					<div className="text-center">
						<p className="font-bold text-2xl text-red-500">
							{summary.worstScore}%
						</p>
						<p className="text-muted-foreground text-sm">Lowest</p>
					</div>
				</div>
			</div>

			{/* Weak Phonemes */}
			{summary.weakPhonemes?.length > 0 && (
				<WeakPhonemesSection phonemes={summary.weakPhonemes} />
			)}

			{/* Weak Words */}
			{summary.weakWords?.length > 0 && (
				<div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
					<h3 className="mb-3 font-semibold text-lg text-red-700 dark:text-red-300">
						Words to Practice
					</h3>
					<div className="flex flex-wrap gap-2">
						{summary.weakWords.map((word) => (
							<span
								key={word}
								className="rounded-lg bg-red-100 px-3 py-1.5 font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300"
							>
								{word}
							</span>
						))}
					</div>
				</div>
			)}

			{/* AI Feedback Section */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<Sparkles className="size-5 text-primary" />
					<h3 className="font-semibold text-lg">AI Coach Feedback</h3>
				</div>

				{(feedbackStatus === "pending" ||
					feedbackStatus === "processing" ||
					isFeedbackLoading) && (
					<div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed p-8">
						<Loader2 className="size-5 animate-spin text-muted-foreground" />
						<p className="text-muted-foreground">
							Generating personalized feedback...
						</p>
					</div>
				)}

				{feedbackStatus === "failed" && (
					<div className="flex items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
						<AlertCircle className="size-5 text-red-500" />
						<p className="text-red-700 dark:text-red-300">
							Failed to generate feedback. Please try again.
						</p>
						<Button variant="outline" size="sm" onClick={() => refetch()}>
							Retry
						</Button>
					</div>
				)}

				{feedbackStatus === "completed" && feedback && (
					<div className="space-y-4">
						{/* Analysis */}
						<div className="rounded-2xl border bg-card p-6">
							<p className="text-foreground leading-relaxed">
								{feedback.overallAnalysis}
							</p>
						</div>

						{/* Strengths */}
						{feedback.strengths.length > 0 && (
							<div className="rounded-2xl border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
								<div className="mb-3 flex items-center gap-2">
									<Star className="size-5 text-green-600" />
									<h4 className="font-semibold text-green-700 dark:text-green-300">
										Strengths
									</h4>
								</div>
								<ul className="space-y-2">
									{feedback.strengths.map((s) => (
										<li
											key={s}
											className="flex items-start gap-2 text-green-800 dark:text-green-200"
										>
											<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-green-500" />
											{s}
										</li>
									))}
								</ul>
							</div>
						)}

						{/* Areas to improve */}
						{feedback.areasToImprove.length > 0 && (
							<div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
								<div className="mb-3 flex items-center gap-2">
									<ArrowUpRight className="size-5 text-amber-600" />
									<h4 className="font-semibold text-amber-700 dark:text-amber-300">
										Areas to Improve
									</h4>
								</div>
								<ul className="space-y-2">
									{feedback.areasToImprove.map((s) => (
										<li
											key={s}
											className="flex items-start gap-2 text-amber-800 dark:text-amber-200"
										>
											<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
											{s}
										</li>
									))}
								</ul>
							</div>
						)}

						{/* Practice Suggestions */}
						{feedback.suggestions.length > 0 && (
							<div className="space-y-3">
								<h4 className="font-semibold text-lg">Practice Suggestions</h4>
								{feedback.suggestions.map((suggestion) => {
									const Icon = SUGGESTION_ICONS[suggestion.type] ?? Target;
									return (
										<div
											key={suggestion.title}
											className={cn(
												"rounded-xl border p-4",
												PRIORITY_STYLES[suggestion.priority] ??
													PRIORITY_STYLES.medium,
											)}
										>
											<div className="mb-2 flex items-center gap-2">
												<Icon className="size-4" />
												<span className="font-medium">{suggestion.title}</span>
												<span className="ml-auto rounded-full bg-white/50 px-2 py-0.5 text-xs uppercase dark:bg-black/20">
													{suggestion.priority}
												</span>
											</div>
											<p className="mb-2 text-sm">{suggestion.description}</p>
											{suggestion.examples.length > 0 && (
												<div className="flex flex-wrap gap-1.5">
													{suggestion.examples.map((ex) => (
														<span
															key={ex}
															className="rounded-md bg-white/60 px-2 py-0.5 font-mono text-sm dark:bg-black/20"
														>
															{ex}
														</span>
													))}
												</div>
											)}
										</div>
									);
								})}
							</div>
						)}

						{/* Recommended Level */}
						{feedback.recommendedLevel && (
							<div className="rounded-2xl border bg-card p-6 text-center">
								<p className="text-muted-foreground text-sm">
									Recommended level for next session
								</p>
								<p className="mt-1 font-bold text-2xl text-primary">
									{feedback.recommendedLevel}
								</p>
								{feedback.recommendedLevel !== cefrLevel && (
									<p className="mt-1 text-muted-foreground text-xs">
										{feedback.recommendedLevel > cefrLevel
											? "Great progress! Ready for a challenge."
											: "Let's build a stronger foundation first."}
									</p>
								)}
							</div>
						)}

						{/* Next Steps */}
						{feedback.nextSteps && (
							<div className="rounded-2xl border bg-primary/5 p-6 text-center">
								<p className="font-medium text-primary leading-relaxed">
									{feedback.nextSteps}
								</p>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Actions */}
			<div className="flex justify-center gap-4 pb-8">
				<Button
					variant="outline"
					onClick={() => navigate({ to: "/pronunciation" })}
					className="gap-2"
				>
					<ChevronLeft className="size-4" />
					Back
				</Button>
				<Button
					onClick={() => navigate({ to: "/pronunciation" })}
					className="gap-2"
				>
					<RefreshCw className="size-4" />
					Practice Again
				</Button>
			</div>
		</div>
	);
}
