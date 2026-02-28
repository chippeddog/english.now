import { env } from "@english.now/env/client";
import { useQuery } from "@tanstack/react-query";
import {
	AlertCircle,
	AlertTriangle,
	BookOpen,
	Dumbbell,
	Loader2,
	Repeat,
	Sparkles,
	Target,
	Volume2,
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

type MistakePattern = {
	type: "phoneme" | "word_stress" | "omission" | "mispronunciation" | "fluency";
	sound: string;
	description: string;
	words: string[];
	practiceWords: string[];
	priority: "high" | "medium" | "low";
};

type MiniExercise = {
	type:
		| "repeat_after"
		| "minimal_pairs"
		| "tongue_twister"
		| "word_chain"
		| "sentence_practice";
	title: string;
	instruction: string;
	items: string[];
	targetSkill: string;
};

type WeakArea = {
	category:
		| "vowels"
		| "consonants"
		| "word_stress"
		| "rhythm"
		| "intonation"
		| "linking";
	severity: "high" | "medium" | "low";
	sounds: string[];
	description: string;
};

type PracticeWordSet = {
	word: string;
	issue: string;
	relatedWords: string[];
};

type PronunciationFeedback = {
	mistakePatterns: MistakePattern[];
	exercises: MiniExercise[];
	weakAreas: WeakArea[];
	practiceWordSets: PracticeWordSet[];
};

const PRIORITY_STYLES: Record<string, string> = {
	high: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20",
	medium:
		"border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20",
	low: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20",
};

const SEVERITY_STYLES: Record<string, string> = {
	high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
	medium:
		"bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
	low: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

const EXERCISE_ICONS: Record<string, typeof Target> = {
	repeat_after: Volume2,
	minimal_pairs: Repeat,
	tongue_twister: Sparkles,
	word_chain: BookOpen,
	sentence_practice: Dumbbell,
};

const MISTAKE_ICONS: Record<string, typeof Target> = {
	phoneme: Target,
	word_stress: AlertTriangle,
	omission: AlertCircle,
	mispronunciation: Volume2,
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
	paragraphText,
	attempts = [],
}: {
	summary: SessionSummary;
	sessionId: string;
	paragraphText?: string;
	attempts?: AttemptForReview[];
}) {
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
							{/* Mistake Patterns */}
							{feedback.mistakePatterns?.length > 0 && (
								<div className="space-y-3">
									<h4 className="font-semibold text-lg">Mistake Patterns</h4>
									{feedback.mistakePatterns.map((pattern) => {
										const Icon = MISTAKE_ICONS[pattern.type] ?? Target;
										return (
											<div
												key={pattern.description}
												className={cn(
													"rounded-xl border p-4",
													PRIORITY_STYLES[pattern.priority] ??
														PRIORITY_STYLES.medium,
												)}
											>
												<div className="mb-2 flex items-center gap-2">
													<Icon className="size-4" />
													<span className="font-medium">
														{pattern.description}
													</span>
													{pattern.sound && (
														<span className="rounded-md bg-white/60 px-2 py-0.5 font-mono text-xs dark:bg-black/20">
															{pattern.sound}
														</span>
													)}
													<span className="ml-auto rounded-full bg-white/50 px-2 py-0.5 text-xs uppercase dark:bg-black/20">
														{pattern.priority}
													</span>
												</div>

												{pattern.words.length > 0 && (
													<div className="mb-2">
														<p className="mb-1 text-muted-foreground text-xs">
															Your mistakes
														</p>
														<div className="flex flex-wrap gap-1.5">
															{pattern.words.map((w) => (
																<span
																	key={w}
																	className="rounded-md bg-red-100 px-2 py-0.5 font-mono text-red-700 text-sm dark:bg-red-900/40 dark:text-red-300"
																>
																	{w}
																</span>
															))}
														</div>
													</div>
												)}

												{pattern.practiceWords.length > 0 && (
													<div>
														<p className="mb-1 text-muted-foreground text-xs">
															Practice these
														</p>
														<div className="flex flex-wrap gap-1.5">
															{pattern.practiceWords.map((w) => (
																<span
																	key={w}
																	className="rounded-md bg-white/60 px-2 py-0.5 font-mono text-sm dark:bg-black/20"
																>
																	{w}
																</span>
															))}
														</div>
													</div>
												)}
											</div>
										);
									})}
								</div>
							)}

							{/* Mini Exercises */}
							{feedback.exercises?.length > 0 && (
								<div className="space-y-3">
									<h4 className="font-semibold text-lg">Mini Practice</h4>
									{feedback.exercises.map((exercise) => {
										const Icon = EXERCISE_ICONS[exercise.type] ?? Dumbbell;
										return (
											<div
												key={exercise.title}
												className="rounded-xl border bg-card p-4"
											>
												<div className="mb-2 flex items-center gap-2">
													<Icon className="size-4 text-primary" />
													<span className="font-medium">{exercise.title}</span>
													<span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-primary text-xs">
														{exercise.targetSkill}
													</span>
												</div>
												<p className="mb-3 text-muted-foreground text-sm">
													{exercise.instruction}
												</p>
												<div className="flex flex-wrap gap-2">
													{exercise.items.map((item) => (
														<span
															key={item}
															className="rounded-lg border bg-muted/50 px-3 py-1.5 font-mono text-sm"
														>
															{item}
														</span>
													))}
												</div>
											</div>
										);
									})}
								</div>
							)}

							{/* Weak Areas */}
							{feedback.weakAreas?.length > 0 && (
								<div className="space-y-3">
									<h4 className="font-semibold text-lg">Weak Areas</h4>
									{feedback.weakAreas.map((area) => (
										<div
											key={`${area.category}-${area.description}`}
											className="flex items-start gap-3 rounded-xl border p-4"
										>
											<span
												className={cn(
													"mt-0.5 shrink-0 rounded-full px-2 py-0.5 font-medium text-xs capitalize",
													SEVERITY_STYLES[area.severity] ??
														SEVERITY_STYLES.medium,
												)}
											>
												{area.severity}
											</span>
											<div className="min-w-0 flex-1">
												<p className="font-medium capitalize">
													{area.category.replace("_", " ")}
												</p>
												<p className="text-muted-foreground text-sm">
													{area.description}
												</p>
												{area.sounds.length > 0 && (
													<div className="mt-2 flex flex-wrap gap-1.5">
														{area.sounds.map((s) => (
															<span
																key={s}
																className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs"
															>
																{s}
															</span>
														))}
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							)}

							{/* Practice Word Sets */}
							{feedback.practiceWordSets?.length > 0 && (
								<div className="space-y-3">
									<h4 className="font-semibold text-lg">Word Practice Sets</h4>
									<div className="grid gap-3">
										{feedback.practiceWordSets.map((set) => (
											<div key={set.word} className="rounded-xl border p-4">
												<div className="mb-2 flex items-center gap-2">
													<span className="rounded-md bg-red-100 px-2.5 py-1 font-mono font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">
														{set.word}
													</span>
													<span className="text-muted-foreground text-sm">
														{set.issue}
													</span>
												</div>
												<div className="flex flex-wrap gap-1.5">
													{set.relatedWords.map((rw) => (
														<span
															key={rw}
															className="rounded-md bg-muted/50 px-2 py-0.5 font-mono text-sm"
														>
															{rw}
														</span>
													))}
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
