import type { AppRouter } from "@english.now/api/routers/index";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import {
	BookOpen,
	Bot,
	Check,
	Loader,
	Loader2,
	MessageSquare,
	Mic,
	Sparkles,
	UserIcon,
	Volume1,
	Volume2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConversationVocabulary } from "@/hooks/use-conversation-vocabulary";
import usePlaybackFromUrl from "@/hooks/use-playback-from-url";
import useTextToSpeech from "@/hooks/use-text-to-speech";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/utils/date";
import { useTRPC } from "@/utils/trpc";
import { Button } from "../ui/button";
import ClickableMessage from "./clickable-message";
import { ReviewTaskCard } from "./review/review-task-card";

type ReviewResponse =
	inferRouterOutputs<AppRouter>["conversation"]["getReview"];
type ReviewData = ReviewResponse["review"];
type PracticeProgress = ReviewResponse["practiceProgress"];
type ReportAccess = ReviewResponse["reportAccess"];
type ReviewType = "grammar" | "vocabulary" | "pronunciation";

const REVIEW_TYPES: ReviewType[] = ["pronunciation", "vocabulary", "grammar"];

const EMPTY_REVIEW_TYPE_COPY: Record<
	ReviewType,
	{ title: string; description: string }
> = {
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
	grammar: {
		title: "No grammar tasks yet",
		description:
			"We didn't find any grammar corrections that need follow-up practice here.",
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
		) ?? "pronunciation"
	);
}

function TranscriptMessage({
	sessionId,
	messageId,
	content,
	role,
	vocabMode,
	audioUrl,
	playingId,
	onPlayAudio,
}: {
	sessionId: string;
	messageId: string;
	content: string;
	role: "user" | "assistant";
	vocabMode: "off" | "word" | "phrase";
	audioUrl?: string | null;
	playingId: string | null;
	onPlayAudio: (url: string, id: string) => void;
}) {
	return (
		<div className="flex gap-3 pb-3">
			<div className="flex shrink-0 flex-col items-center gap-1">
				<div
					className={cn(
						"flex size-7 items-center justify-center rounded-full font-medium text-xs",
						role === "assistant"
							? "bg-neutral-200 text-neutral-600"
							: "bg-lime-100 text-lime-700",
					)}
				>
					{role === "assistant" ? (
						<Bot className="size-4" />
					) : (
						<UserIcon className="size-4" aria-label="User" />
					)}
				</div>
			</div>
			<div className="flex-1">
				<div className="mb-1 flex items-center gap-2">
					<span className="flex items-center gap-1.5 font-semibold text-sm">
						{role === "assistant" ? "Assistant" : "You"}
						{role === "user" && audioUrl ? (
							<button
								type="button"
								onClick={() => onPlayAudio(audioUrl, messageId)}
								className={cn(
									"rounded-md p-0.5 transition-colors hover:bg-neutral-100",
									playingId === messageId
										? "text-primary"
										: "text-muted-foreground",
								)}
								aria-label={
									playingId === messageId
										? "Stop playback"
										: "Play your recording"
								}
								aria-pressed={playingId === messageId}
							>
								{playingId === messageId ? (
									<Volume2 className="size-4" />
								) : (
									<Volume1 className="size-4" />
								)}
							</button>
						) : null}
					</span>
				</div>
				<p className="text-sm leading-relaxed">
					<ClickableMessage
						sessionId={sessionId}
						content={content}
						vocabMode={vocabMode}
					/>
				</p>
			</div>
		</div>
	);
}

function VocabModeToggle({
	value,
	onChange,
}: {
	value: "off" | "word" | "phrase";
	onChange: (value: "off" | "word" | "phrase") => void;
}) {
	return (
		<div className="inline-flex rounded-xl border bg-white p-1">
			{(["off", "word", "phrase"] as const).map((item) => (
				<button
					key={item}
					type="button"
					onClick={() => onChange(item)}
					className={cn(
						"rounded-lg px-3 py-1.5 font-medium text-xs capitalize transition-colors",
						value === item
							? "bg-neutral-900 text-white"
							: "text-muted-foreground hover:bg-neutral-100",
					)}
				>
					{item === "off" ? "Transcript" : item}
				</button>
			))}
		</div>
	);
}

export function LoadingState() {
	return (
		<div className="container mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center px-4 py-8">
			<div className="flex flex-col items-center gap-4">
				<Loader className="size-7 animate-spin text-lime-600" />
				<p className="font-medium text-foreground-muted">
					Analyzing your session...
				</p>
			</div>
		</div>
	);
}

export default function ReviewView({
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
	const [vocabMode, setVocabMode] = useState<"off" | "word" | "phrase">("off");
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

	return (
		<div className="min-h-dvh bg-neutral-50">
			<div className="container mx-auto max-w-5xl px-4 py-6">
				{/* Header */}
				<div className="mb-6 flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div>
							<h1 className="font-semibold text-xl">{session?.scenario}</h1>
							{/* <p className="text-muted-foreground text-sm">
								{formatRelativeDate(new Date(session?.createdAt ?? new Date()))}
							</p> */}
						</div>
					</div>
					<div className="flex items-center gap-2">
						{isPreviewLocked && (
							<span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-[11px] text-amber-700 uppercase tracking-wide">
								Preview
							</span>
						)}
					</div>
					<div className="grid gap-4">
						<div className="flex items-center justify-between gap-3">
							<div className="group flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-xl border border-neutral-200 bg-linear-to-b from-neutral-50 to-neutral-100 px-2.5 py-1.5 font-medium text-neutral-700 text-sm italic shadow-none transition duration-150 ease-in-out will-change-transform hover:brightness-95 focus:shadow-none focus:outline-none focus-visible:shadow-none">
								Score
								<span className="font-bold text-neutral-700/80 italic group-hover:text-neutral-700">
									{review?.overallScore ?? 0}
								</span>
							</div>

							{/* <div>
								<p className="text-muted-foreground text-sm">
									Practiced {practiceProgress.practicedTasks} of{" "}
									{practiceProgress.totalTasks} tasks
								</p>
							</div>
							<div className="rounded-full bg-lime-100 px-3 py-1 font-semibold text-lime-700 text-sm">
								{practiceProgress.completedTasks} completed
							</div> */}
						</div>
						{/* <div className="grid gap-3 sm:grid-cols-3">
									{scores.map((item) => {
										const Icon = item.icon;
										const typeKey = item.label.toLowerCase() as
											| "grammar"
											| "vocabulary"
											| "pronunciation";
										const typeProgress = practiceProgress.byType[typeKey];
										return (
											<div
												key={item.label}
												className="rounded-xl bg-neutral-50 p-4"
											>
												<div className="mb-2 flex items-center justify-between">
													<div className="flex items-center gap-2">
														<Icon className="size-4 text-muted-foreground" />
														<span className="font-medium text-sm">
															{item.label}
														</span>
													</div>
													<span className="font-semibold text-sm">
														{item.score}
													</span>
												</div>
												<p className="text-muted-foreground text-xs">
													{typeProgress.practiced} practiced /{" "}
													{typeProgress.total} tasks
												</p>
											</div>
										);
									})}
								</div> */}
					</div>
				</div>

				<div className="grid grid-cols-1 items-start gap-6 md:grid-cols-4">
					<div className="space-y-6 md:col-span-2">
						<div className="space-y-4">
							<Tabs
								value={activeReviewType}
								onValueChange={(value) => {
									if (isReviewType(value)) {
										setActiveReviewType(value);
									}
								}}
								className="w-full"
							>
								<div className="mb-4 flex items-center gap-0.5 rounded-2xl border border-border/50 bg-muted/50 p-1">
									<TabsList className="grid h-auto w-full grid-cols-3 bg-transparent p-0">
										<TabsTrigger
											value="grammar"
											className="flex h-[34px] cursor-pointer items-center justify-center rounded-xl px-2.5 py-3 font-medium text-muted-foreground text-sm italic transition-all data-[state=active]:bg-white"
										>
											Grammar
										</TabsTrigger>
										<TabsTrigger
											value="pronunciation"
											className="flex h-[34px] cursor-pointer items-center justify-center rounded-xl px-2.5 py-3 font-medium text-muted-foreground text-sm italic transition-all data-[state=active]:bg-white"
										>
											Pronunciation
										</TabsTrigger>
										<TabsTrigger
											value="vocabulary"
											className="flex h-[34px] cursor-pointer items-center justify-center rounded-xl px-2.5 py-3 font-medium text-muted-foreground text-sm italic transition-all data-[state=active]:bg-white"
										>
											Vocabulary
										</TabsTrigger>
									</TabsList>
								</div>

								{reviewStatus === "failed" ? (
									<div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
										We couldn&apos;t generate this review yet. Try finishing
										another session after a few more replies.
									</div>
								) : null}

								{review?.availability === "not_enough_messages" ? (
									<div className="rounded-2xl border bg-white p-5 shadow-sm">
										<h3 className="font-semibold">
											Session too short for review
										</h3>
										<p className="mt-2 text-muted-foreground text-sm leading-relaxed">
											Keep the conversation going for at least 3 learner replies
											next time, and we&apos;ll generate targeted grammar,
											vocabulary, and pronunciation tasks here.
										</p>
									</div>
								) : null}

								{reviewStatus !== "failed" &&
								review?.availability !== "not_enough_messages" &&
								!hasTasks ? (
									<div className="rounded-2xl border bg-white p-5 shadow-sm">
										<h3 className="font-semibold">No urgent problems found</h3>
										<p className="mt-2 text-muted-foreground text-sm leading-relaxed">
											This session did not surface clear high-priority fixes.
											Use the transcript tools on the right to save helpful
											words and phrases.
										</p>
									</div>
								) : null}

								{REVIEW_TYPES.map((type) => (
									<TabsContent
										key={type}
										value={type}
										className="mt-0 space-y-4"
									>
										{problemsByType[type].map((problem) => (
											<ReviewTaskCard
												key={problem.id}
												problem={problem}
												task={taskMap.get(problem.id)}
												attempt={attemptMap.get(
													taskMap.get(problem.id)?.id ?? "",
												)}
												onSaveTask={handleSaveTask}
												onAddVocabulary={(text, mode) =>
													addVocabulary({ text, mode })
												}
												onSpeak={speak}
											/>
										))}
										{reviewStatus !== "failed" &&
										review?.availability !== "not_enough_messages" &&
										hasTasks &&
										problemsByType[type].length === 0 ? (
											<div className="rounded-2xl border bg-white p-5 shadow-sm">
												<h3 className="font-semibold">
													{EMPTY_REVIEW_TYPE_COPY[type].title}
												</h3>
												<p className="mt-2 text-muted-foreground text-sm leading-relaxed">
													{EMPTY_REVIEW_TYPE_COPY[type].description}
												</p>
											</div>
										) : null}
									</TabsContent>
								))}
							</Tabs>
						</div>
					</div>

					<div className="space-y-4 md:col-span-2">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="font-semibold text-lg">Transcript</h2>
							</div>
							<VocabModeToggle value={vocabMode} onChange={setVocabMode} />
						</div>

						<div
							className="rounded-3xl bg-white"
							style={{
								boxShadow:
									"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
							}}
						>
							<div className="max-h-[calc(100vh-180px)] space-y-4 divide-y divide-dashed divide-neutral-200 overflow-y-auto p-5">
								{messages.map((msg) => (
									<TranscriptMessage
										key={msg.id}
										sessionId={sessionId}
										messageId={msg.id}
										content={msg.content}
										role={msg.role as "user" | "assistant"}
										vocabMode={vocabMode}
										audioUrl={msg.audioUrl}
										playingId={playingId}
										onPlayAudio={playAudio}
									/>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
