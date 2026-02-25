import { env } from "@english.now/env/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowUpRight,
	BookOpen,
	Lightbulb,
	Loader2,
	RefreshCw,
	Sparkles,
	Star,
	Target,
} from "lucide-react";
import { useEffect, useState } from "react";
import { OverallScore, ScoreBreakdown } from "@/components/pronunciation/score";
import WeakPhonemesSection from "@/components/pronunciation/weak-phonemes";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
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

type PhonemeScore = {
	phoneme: string;
	accuracyScore: number;
};

type WordScore = {
	word: string;
	accuracyScore: number;
	errorType: string;
	phonemes: PhonemeScore[];
};

export type AttemptForReview = {
	id: string;
	score: number;
	wordResults: WordScore[];
};

function getWordColor(w: WordScore) {
	if (
		w.errorType === "Omission" ||
		w.errorType === "Mispronunciation" ||
		w.accuracyScore < 50
	) {
		return "red" as const;
	}
	if (w.errorType !== "None" || w.accuracyScore < 80) {
		return "yellow" as const;
	}
	return "green" as const;
}

const WORD_STYLES = {
	green:
		"text-green-700 bg-green-100 hover:bg-green-200 dark:text-green-300 dark:bg-green-900/40 dark:hover:bg-green-900/60",
	yellow:
		"text-amber-700 bg-amber-100 hover:bg-amber-200 dark:text-amber-300 dark:bg-amber-900/40 dark:hover:bg-amber-900/60",
	red: "text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-300 dark:bg-red-900/40 dark:hover:bg-red-900/60",
} as const;

function phonemeScoreColor(score: number) {
	if (score < 50) return "text-red-600 dark:text-red-400";
	if (score < 80) return "text-amber-600 dark:text-amber-400";
	return "text-green-600 dark:text-green-400";
}

function normalizeForMatch(w: string): string {
	return w.toLowerCase().replace(/[^a-z0-9']/g, "");
}

function fuzzyMatch(a: string, b: string): boolean {
	if (a === b) return true;
	if (a.length < 2 || b.length < 2) return false;
	const shorter = a.length <= b.length ? a : b;
	const longer = a.length > b.length ? a : b;
	return longer.startsWith(shorter);
}

function alignWordsToOriginal(
	originalWords: string[],
	wordResults: WordScore[],
): (WordScore | null)[] {
	const results = wordResults.filter((w) => w.errorType !== "Insertion");
	const alignment: (WordScore | null)[] = Array.from<WordScore | null>({
		length: originalWords.length,
	}).fill(null);

	let rIdx = 0;

	for (let oIdx = 0; oIdx < originalWords.length; oIdx++) {
		if (rIdx >= results.length) break;

		const origNorm = normalizeForMatch(originalWords[oIdx]);
		if (!origNorm) continue;

		const windowEnd = Math.min(rIdx + 3, results.length);
		let bestMatch = -1;

		for (let look = rIdx; look < windowEnd; look++) {
			const resultNorm = normalizeForMatch(results[look].word);
			if (fuzzyMatch(origNorm, resultNorm)) {
				bestMatch = look;
				break;
			}
		}

		if (bestMatch >= 0) {
			alignment[oIdx] = results[bestMatch];
			rIdx = bestMatch + 1;
		}
	}

	return alignment;
}

function TranscriptFeedback({
	paragraphText,
	attempts,
}: {
	paragraphText: string;
	attempts: AttemptForReview[];
}) {
	const [activeAttemptIdx, setActiveAttemptIdx] = useState(0);

	const scored = attempts.filter(
		(a) => a.wordResults && a.wordResults.length > 0,
	);

	if (scored.length === 0 || !paragraphText) return null;

	const sorted = [...scored].sort((a, b) => b.score - a.score);
	const attempt = sorted[activeAttemptIdx] ?? sorted[0];

	const originalTokens: { word: string; key: string }[] = [];
	let charOffset = 0;
	for (const word of paragraphText.split(/\s+/)) {
		originalTokens.push({ word, key: `w-${charOffset}` });
		charOffset += word.length + 1;
	}

	const alignment = alignWordsToOriginal(
		originalTokens.map((t) => t.word),
		attempt.wordResults,
	);

	return (
		<div className="rounded-2xl border bg-card p-8">
			<div className="mb-4 flex items-center justify-between">
				<div>
					<h3 className="font-semibold text-lg">Transcript Feedback</h3>
					<p className="text-muted-foreground text-sm">
						Click any word for phonetic breakdown
					</p>
				</div>
				{sorted.length > 1 && (
					<div className="flex items-center gap-1.5">
						{sorted.map((a, i) => (
							<button
								key={a.id}
								type="button"
								onClick={() => setActiveAttemptIdx(i)}
								className={cn(
									"rounded-full px-3 py-1 font-medium text-xs transition-colors",
									i === activeAttemptIdx
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground hover:bg-muted/80",
								)}
							>
								#{i + 1} — {a.score}%
							</button>
						))}
					</div>
				)}
			</div>

			<div className="flex flex-wrap gap-1.5 leading-relaxed">
				{originalTokens.map(({ word: token, key }, idx) => {
					const matched = alignment[idx];

					if (!matched) {
						return (
							<span
								key={key}
								className="rounded-md px-1.5 py-0.5 text-base text-muted-foreground"
							>
								{token}
							</span>
						);
					}

					const color = getWordColor(matched);
					return (
						<Popover key={key}>
							<PopoverTrigger asChild>
								<button
									type="button"
									className={cn(
										"cursor-pointer rounded-md px-1.5 py-0.5 font-medium text-base transition-all hover:ring-2 hover:ring-primary/30",
										WORD_STYLES[color],
									)}
								>
									{token}
								</button>
							</PopoverTrigger>
							<PopoverContent className="w-64 p-4" side="top">
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="font-semibold text-base">{token}</span>
										<span
											className={cn(
												"font-bold text-lg",
												phonemeScoreColor(matched.accuracyScore),
											)}
										>
											{matched.accuracyScore}%
										</span>
									</div>

									{matched.errorType !== "None" && (
										<span className="inline-block rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700 text-xs dark:bg-red-900/40 dark:text-red-300">
											{matched.errorType}
										</span>
									)}

									{matched.phonemes && matched.phonemes.length > 0 && (
										<div className="border-t pt-2">
											<p className="mb-2 text-muted-foreground text-xs">
												Phoneme Breakdown
											</p>
											<div className="grid grid-cols-2 gap-1.5">
												{matched.phonemes.map((p, pi) => (
													<div
														key={`${p.phoneme}-${pi}`}
														className="flex items-center justify-between rounded bg-muted/50 px-2 py-1"
													>
														<span className="font-mono text-sm">
															/{p.phoneme}/
														</span>
														<span
															className={cn(
																"font-semibold text-sm",
																phonemeScoreColor(p.accuracyScore),
															)}
														>
															{p.accuracyScore}
														</span>
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							</PopoverContent>
						</Popover>
					);
				})}
			</div>

			<div className="mt-4 flex items-center gap-4 border-t pt-3 text-muted-foreground text-xs">
				<div className="flex items-center gap-1.5">
					<span className="size-2.5 rounded-full bg-green-500" />
					Good
				</div>
				<div className="flex items-center gap-1.5">
					<span className="size-2.5 rounded-full bg-amber-500" />
					Minor issue
				</div>
				<div className="flex items-center gap-1.5">
					<span className="size-2.5 rounded-full bg-red-500" />
					Major issue
				</div>
			</div>
		</div>
	);
}

export default function SessionReview({
	summary,
	sessionId,
	cefrLevel,
	paragraphText,
	attempts = [],
}: {
	summary: SessionSummary;
	sessionId: string;
	cefrLevel: string;
	paragraphText?: string;
	attempts?: AttemptForReview[];
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
		<div className="grid grid-cols-5 gap-4 space-y-6">
			{/* {summary.paragraph && (
				<div className="rounded-2xl border bg-card p-8">
					<p className="text-foreground leading-relaxed">{summary.paragraph}</p>
				</div>
			)} */}
			{/* Transcript Feedback */}
			{paragraphText && (
				<div className="col-span-3">
					<TranscriptFeedback
						paragraphText={paragraphText}
						attempts={attempts}
					/>
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
				</div>
			)}
			<div className="col-span-2">
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
									<h4 className="font-semibold text-lg">
										Practice Suggestions
									</h4>
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
													<span className="font-medium">
														{suggestion.title}
													</span>
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
			</div>
		</div>
	);
}
