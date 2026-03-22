import type { AppRouter } from "@english.now/api/routers/index";
import { getConversationSessionMeta } from "@english.now/api/services/conversation-mode";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { BookOpen, MessageSquare, Mic } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { GrammarIssueCard } from "@/components/conversation/review/cards/grammar-issue-card";
import { PronunciationIssueCard } from "@/components/conversation/review/cards/pronunciation-issue-card";
import { VocabularyIssueCard } from "@/components/conversation/review/cards/vocabulary-issue-card";
import { TranscriptReviewRail } from "@/components/conversation/review/transcript-review-rail";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConversationVocabulary } from "@/hooks/use-conversation-vocabulary";
import usePlaybackFromUrl from "@/hooks/use-playback-from-url";
import useTextToSpeech from "@/hooks/use-text-to-speech";
import type { ReviewProblem } from "@/types/conversation-review";
import { useTRPC } from "@/utils/trpc";

type ReviewResponse =
	inferRouterOutputs<AppRouter>["conversation"]["getReview"];
type ReviewData = ReviewResponse["review"];
type PracticeProgress = ReviewResponse["practiceProgress"];
type ReportAccess = ReviewResponse["reportAccess"];
type ReviewType = "grammar" | "pronunciation" | "vocabulary";

const REVIEW_TYPES: ReviewType[] = ["grammar", "pronunciation", "vocabulary"];

const EMPTY_REVIEW_TYPE_COPY: Record<
	ReviewType,
	{ title: string; description: string }
> = {
	grammar: {
		title: "No grammar tasks yet",
		description:
			"We didn't find any grammar corrections that need follow-up practice here.",
	},
	pronunciation: {
		title: "No pronunciation tasks yet",
		description:
			"We didn't spot any pronunciation drills to practice in this session.",
	},
	vocabulary: {
		title: "No vocabulary tasks yet",
		description:
			"This session didn't surface any high-priority vocabulary fixes.",
	},
};

function isReviewType(value: string): value is ReviewType {
	return REVIEW_TYPES.includes(value as ReviewType);
}

function getInitialReviewType(
	problems?: NonNullable<ReviewData>["problems"],
): ReviewType {
	return (
		REVIEW_TYPES.find((type) =>
			problems?.some((problem) => problem.type === type),
		) ?? "grammar"
	);
}

export function ConversationReviewScreen({
	attempts,
	messages,
	practiceProgress,
	session,
	reportAccess,
	review,
	reviewStatus,
}: {
	attempts: ReviewResponse["attempts"];
	messages: ReviewResponse["messages"];
	practiceProgress: PracticeProgress;
	session: ReviewResponse["session"];
	reportAccess: ReportAccess;
	review: ReviewData;
	reviewStatus: ReviewResponse["reviewStatus"];
}) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { speak } = useTextToSpeech();
	const { playingId, playAudio } = usePlaybackFromUrl();
	const sessionId = session?.id ?? "";
	const sessionMeta = useMemo(
		() => (session ? getConversationSessionMeta(session) : null),
		[session],
	);
	const isRoleplay = sessionMeta?.mode === "roleplay";
	const [activeReviewType, setActiveReviewType] = useState<ReviewType>(() =>
		getInitialReviewType(review?.problems),
	);

	const { addVocabulary } = useConversationVocabulary(sessionId);
	const saveTaskResult = useMutation(
		trpc.conversation.saveReviewTaskResult.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.conversation.getReview.queryKey({ sessionId }),
				});
			},
			onError: (error) => {
				toast.error(error.message ?? "Failed to save task progress");
			},
		}),
	);

	const attemptMap = useMemo(
		() => new Map(attempts.map((attempt) => [attempt.taskId, attempt])),
		[attempts],
	);

	const isPreviewLocked = reportAccess.locked && reportAccess.preview;
	const taskMap = useMemo(
		() => new Map((review?.tasks ?? []).map((task) => [task.problemId, task])),
		[review?.tasks],
	);
	const problemsByType = useMemo(
		() =>
			Object.fromEntries(
				REVIEW_TYPES.map((type) => [
					type,
					(review?.problems ?? []).filter((problem) => problem.type === type),
				]),
			) as Record<ReviewType, NonNullable<ReviewData>["problems"]>,
		[review?.problems],
	);

	const hasTasks = (review?.tasks.length ?? 0) > 0;

	const handleSaveTask = (input: {
		taskId: string;
		problemId: string;
		type: "grammar" | "vocabulary" | "pronunciation";
		status: "practiced" | "completed" | "skipped";
		result?: Record<string, unknown>;
	}) => {
		saveTaskResult.mutate({
			sessionId,
			...input,
			result: input.result,
		});
	};

	const handleTabChange = (value: string) => {
		if (!isReviewType(value)) return;
		setActiveReviewType(value);
	};

	const onPracticeAll = () => {
		for (const type of REVIEW_TYPES) {
			const list = problemsByType[type];
			for (const p of list) {
				const task = taskMap.get(p.id);
				if (!task) continue;
				const att = attemptMap.get(task.id);
				if (!att || att.status !== "completed") {
					setActiveReviewType(type);
					return;
				}
			}
		}
		toast.message("You're caught up", {
			description:
				"Completed tasks are all done. Revisit any tab to practice again.",
		});
	};

	const renderIssueCard = (problem: ReviewProblem) => {
		const task = taskMap.get(problem.id);
		const attempt = attemptMap.get(task?.id ?? "");

		if (problem.type === "grammar") {
			return (
				<GrammarIssueCard
					key={problem.id}
					problem={problem}
					task={task}
					sessionId={sessionId}
					onSaveTask={handleSaveTask}
					onSpeak={speak}
				/>
			);
		}
		if (problem.type === "vocabulary") {
			return (
				<VocabularyIssueCard
					key={problem.id}
					problem={problem}
					task={task}
					sessionId={sessionId}
					onSaveTask={handleSaveTask}
					onSpeak={speak}
					onAddVocabulary={(text, mode) => addVocabulary({ text, mode })}
				/>
			);
		}
		return (
			<PronunciationIssueCard
				key={problem.id}
				problem={problem}
				task={task}
				attempt={attempt}
				sessionId={sessionId}
				onSaveTask={handleSaveTask}
				onAddVocabulary={(text, mode) => addVocabulary({ text, mode })}
				onSpeak={speak}
			/>
		);
	};

	return (
		<div className="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
			<div className="container mx-auto max-w-5xl px-4 py-6">
				<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<h1 className="font-semibold text-xl">{session?.scenario}</h1>
						<div className="mt-2 flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
							<span className="inline-flex items-center gap-1">
								<BookOpen className="size-3.5" />
								Grammar {review?.scores.grammar ?? "—"}
							</span>
							<span className="inline-flex items-center gap-1">
								<Mic className="size-3.5" />
								Pron. {review?.scores.pronunciation ?? "—"}
							</span>
							<span className="inline-flex items-center gap-1">
								<MessageSquare className="size-3.5" />
								Vocab {review?.scores.vocabulary ?? "—"}
							</span>
							<span aria-hidden>·</span>
							<span>
								{practiceProgress.completedTasks}/{practiceProgress.totalTasks}{" "}
								done
							</span>
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						{isPreviewLocked ? (
							<span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-[11px] text-amber-700 uppercase tracking-wide dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
								Preview
							</span>
						) : null}
						<div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-linear-to-b from-neutral-50 to-neutral-100 px-2.5 py-1.5 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950">
							<span className="font-medium text-neutral-700 text-sm dark:text-neutral-200">
								Score
							</span>
							<span className="font-bold text-neutral-900 text-sm dark:text-neutral-100">
								{review?.overallScore ?? 0}
							</span>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 items-start gap-6 md:grid-cols-4">
					<div className="space-y-6 md:col-span-2">
						<Tabs
							value={activeReviewType}
							onValueChange={handleTabChange}
							className="w-full"
						>
							<div className="mb-4 flex items-center gap-0.5 rounded-2xl border border-border/50 bg-muted/50 p-1 dark:border-neutral-800 dark:bg-neutral-900/50">
								<TabsList className="grid h-auto w-full grid-cols-3 bg-transparent p-0">
									<TabsTrigger
										value="grammar"
										className="flex h-[34px] cursor-pointer items-center justify-center rounded-xl px-2.5 py-3 font-medium text-muted-foreground text-sm transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-neutral-950"
									>
										Grammar
									</TabsTrigger>
									<TabsTrigger
										value="pronunciation"
										className="flex h-[34px] cursor-pointer items-center justify-center rounded-xl px-2.5 py-3 font-medium text-muted-foreground text-sm transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-neutral-950"
									>
										Pronunciation
									</TabsTrigger>
									<TabsTrigger
										value="vocabulary"
										className="flex h-[34px] cursor-pointer items-center justify-center rounded-xl px-2.5 py-3 font-medium text-muted-foreground text-sm transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-neutral-950"
									>
										Vocabulary
									</TabsTrigger>
								</TabsList>
							</div>

							{reviewStatus === "failed" ? (
								<div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
									We couldn&apos;t generate this review yet. Try finishing
									another session after a few more replies.
								</div>
							) : null}

							{review?.availability === "not_enough_messages" ? (
								<div className="rounded-2xl border bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
									<h3 className="font-semibold">
										Session too short for review
									</h3>
									<p className="mt-2 text-muted-foreground text-sm leading-relaxed">
										Keep the {isRoleplay ? "roleplay" : "conversation"} going
										for at least 3 learner replies next time, and we&apos;ll
										generate targeted grammar, vocabulary, and pronunciation
										tasks here.
									</p>
								</div>
							) : null}

							{reviewStatus !== "failed" &&
							review?.availability !== "not_enough_messages" &&
							!hasTasks ? (
								<div className="rounded-2xl border bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
									<h3 className="font-semibold">No urgent problems found</h3>
									<p className="mt-2 text-muted-foreground text-sm leading-relaxed">
										This session did not surface clear high-priority fixes in
										grammar, vocabulary, or pronunciation.
									</p>
								</div>
							) : null}

							{REVIEW_TYPES.map((type) => {
								const all = problemsByType[type];
								return (
									<TabsContent
										key={type}
										value={type}
										className="mt-0 space-y-4"
									>
										{all.map((problem) => renderIssueCard(problem))}
										{reviewStatus !== "failed" &&
										review?.availability !== "not_enough_messages" &&
										hasTasks &&
										all.length === 0 ? (
											<div className="rounded-2xl border bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
												<h3 className="font-semibold">
													{EMPTY_REVIEW_TYPE_COPY[type].title}
												</h3>
												<p className="mt-2 text-muted-foreground text-sm leading-relaxed">
													{EMPTY_REVIEW_TYPE_COPY[type].description}
												</p>
											</div>
										) : null}
									</TabsContent>
								);
							})}
						</Tabs>
					</div>

					<div className="md:col-span-2">
						<TranscriptReviewRail
							sessionId={sessionId}
							messages={messages}
							problems={(review?.problems ?? []) as ReviewProblem[]}
							playingId={playingId}
							onPlayAudio={playAudio}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
