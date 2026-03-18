import type { AppRouter } from "@english.now/api/routers/index";
import { env } from "@english.now/env/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import {
	BookOpen,
	Check,
	CheckCircle2,
	Loader2,
	MessageSquare,
	Mic,
	SkipForward,
	Sparkles,
	TrendingUp,
	Volume2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useConversationVocabulary } from "@/hooks/use-conversation-vocabulary";
import useTextToSpeech from "@/hooks/use-text-to-speech";
import useVoiceRecorder from "@/hooks/use-voice-recorder";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/utils/date";
import { useTRPC } from "@/utils/trpc";
import ClickableMessage from "./clickable-message";

type ReviewResponse =
	inferRouterOutputs<AppRouter>["conversation"]["getReview"];
type ReviewData = ReviewResponse["review"];
type PracticeProgress = ReviewResponse["practiceProgress"];
type ReportAccess = ReviewResponse["reportAccess"];
type AttemptRow = ReviewResponse["attempts"][number];

type GenerationStep = {
	id: string;
	label: string;
	icon: typeof Sparkles;
	delay: number;
};

const STEPS: GenerationStep[] = [
	{
		id: "pronunciation",
		label: "Analyzing pronunciation",
		icon: Mic,
		delay: 0,
	},
	{ id: "grammar", label: "Checking grammar", icon: BookOpen, delay: 2000 },
	{
		id: "vocabulary",
		label: "Evaluating vocabulary",
		icon: MessageSquare,
		delay: 4000,
	},
	{
		id: "tasks",
		label: "Preparing your practice tasks",
		icon: Sparkles,
		delay: 6000,
	},
];

function TranscriptMessage({
	sessionId,
	content,
	role,
	vocabMode,
}: {
	sessionId: string;
	content: string;
	role: "user" | "assistant";
	vocabMode: "off" | "word" | "phrase";
}) {
	return (
		<div className="flex gap-3">
			<div className="flex shrink-0 flex-col items-center gap-1">
				<div
					className={cn(
						"flex size-8 items-center justify-center rounded-full font-medium text-xs",
						role === "assistant"
							? "bg-neutral-200 text-neutral-600"
							: "bg-lime-100 text-lime-700",
					)}
				>
					{role === "assistant" ? "AI" : "You"}
				</div>
			</div>
			<div className="flex-1">
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

function ScoreRing({
	score,
	size = 80,
	strokeWidth = 6,
	className,
	label,
}: {
	score: number;
	size?: number;
	strokeWidth?: number;
	className?: string;
	label?: string;
}) {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (score / 100) * circumference;

	const getColor = (s: number) => {
		if (s >= 80)
			return { stroke: "#22c55e", bg: "bg-green-50", text: "text-green-700" };
		if (s >= 60)
			return { stroke: "#84cc16", bg: "bg-lime-50", text: "text-lime-700" };
		if (s >= 40)
			return { stroke: "#eab308", bg: "bg-yellow-50", text: "text-yellow-700" };
		return { stroke: "#ef4444", bg: "bg-red-50", text: "text-red-700" };
	};

	const color = getColor(score);

	return (
		<div className={cn("flex flex-col items-center gap-2", className)}>
			<div className="relative" style={{ width: size, height: size }}>
				<svg
					width={size}
					height={size}
					className="-rotate-90"
					aria-hidden="true"
				>
					<title>Score</title>
					<circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						fill="none"
						stroke="currentColor"
						strokeWidth={strokeWidth}
						className="text-muted/30"
					/>
					<circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						fill="none"
						stroke={color.stroke}
						strokeWidth={strokeWidth}
						strokeDasharray={circumference}
						strokeDashoffset={offset}
						strokeLinecap="round"
						className="transition-all duration-1000 ease-out"
					/>
				</svg>
				<div className="absolute inset-0 flex items-center justify-center">
					<span className={cn("font-bold text-lg", color.text)}>{score}</span>
				</div>
			</div>
			{label && (
				<span className="text-center font-medium text-muted-foreground text-xs">
					{label}
				</span>
			)}
		</div>
	);
}

function CorrectionBadge({ type }: { type: string }) {
	const config: Record<string, { label: string; className: string }> = {
		grammar: { label: "Grammar", className: "bg-blue-100 text-blue-700" },
		vocabulary: {
			label: "Vocabulary",
			className: "bg-purple-100 text-purple-700",
		},
		pronunciation: {
			label: "Pronunciation",
			className: "bg-amber-100 text-amber-700",
		},
		fluency: { label: "Fluency", className: "bg-emerald-100 text-emerald-700" },
	};
	const c = config[type] ?? {
		label: type,
		className: "bg-gray-100 text-gray-700",
	};
	return (
		<span
			className={cn(
				"rounded-full px-2 py-0.5 font-medium text-[10px]",
				c.className,
			)}
		>
			{c.label}
		</span>
	);
}

function TaskStatusBadge({ status }: { status?: string }) {
	if (!status) {
		return (
			<span className="rounded-full bg-neutral-100 px-2.5 py-1 font-medium text-[11px] text-neutral-600">
				New task
			</span>
		);
	}

	const config: Record<string, string> = {
		practiced: "bg-lime-100 text-lime-700",
		completed: "bg-green-100 text-green-700",
		skipped: "bg-neutral-200 text-neutral-600",
	};

	return (
		<span
			className={cn(
				"rounded-full px-2.5 py-1 font-medium text-[11px]",
				config[status] ?? "bg-neutral-100 text-neutral-600",
			)}
		>
			{status === "completed"
				? "Completed"
				: status === "practiced"
					? "Practiced"
					: "Skipped"}
		</span>
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

function blobToBase64(blob: Blob): Promise<string> {
	return blob.arrayBuffer().then((buffer) => {
		const bytes = new Uint8Array(buffer);
		let binary = "";
		for (const byte of bytes) {
			binary += String.fromCharCode(byte);
		}
		return btoa(binary);
	});
}

function getAttemptScore(attempt?: AttemptRow) {
	const score = attempt?.result?.score;
	return typeof score === "number" ? score : null;
}

function getVocabularyCandidates(
	problem: NonNullable<ReviewData>["problems"][number],
	task: NonNullable<ReviewData>["tasks"][number] | undefined,
) {
	const candidates = new Set<string>();
	for (const item of problem.vocabularyItems ?? []) {
		if (item.trim()) candidates.add(item.trim());
	}
	for (const item of task?.payload.vocabularyItems ?? []) {
		if (item.trim()) candidates.add(item.trim());
	}
	return [...candidates];
}

function ReviewTaskCard({
	problem,
	task,
	attempt,
	onSaveTask,
	onAddVocabulary,
	onSpeak,
}: {
	problem: NonNullable<ReviewData>["problems"][number];
	task?: NonNullable<ReviewData>["tasks"][number];
	attempt?: AttemptRow;
	onSaveTask: (input: {
		taskId: string;
		problemId: string;
		type: "grammar" | "vocabulary" | "pronunciation";
		status: "practiced" | "completed" | "skipped";
		result?: Record<string, unknown>;
	}) => void;
	onAddVocabulary: (text: string, mode: "word" | "phrase") => void;
	onSpeak: (text: string) => void;
}) {
	const { isRecording, startRecording, stopRecording } = useVoiceRecorder();
	const [isAssessing, setIsAssessing] = useState(false);
	const [localScore, setLocalScore] = useState<number | null>(null);
	const [localTranscript, setLocalTranscript] = useState<string | null>(null);

	const practiceText =
		task?.payload.practiceText ?? problem.suggestedText ?? problem.sourceText;
	const vocabularyCandidates = getVocabularyCandidates(problem, task);
	const currentScore = localScore ?? getAttemptScore(attempt);
	const attemptStatus = attempt?.status;
	const pronunciationTarget =
		task?.payload.pronunciationTarget ??
		problem.pronunciationTargets?.[0]?.text ??
		problem.suggestedText;

	const assessPronunciation = async () => {
		const blob = await stopRecording();
		if (!blob || !task || !pronunciationTarget) return;

		setIsAssessing(true);
		try {
			const audio = await blobToBase64(blob);
			const response = await fetch(
				`${env.VITE_SERVER_URL}/api/pronunciation/assess`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						audio,
						referenceText: pronunciationTarget,
					}),
				},
			);

			if (!response.ok) {
				const err = (await response.json().catch(() => ({}))) as {
					details?: string;
				};
				throw new Error(err.details ?? "Pronunciation assessment failed");
			}

			const result = (await response.json()) as {
				pronunciationScore: number;
				transcript: string;
				accuracyScore?: number;
				fluencyScore?: number;
				completenessScore?: number;
				prosodyScore?: number;
				audioUrl?: string;
			};

			setLocalScore(result.pronunciationScore);
			setLocalTranscript(result.transcript);
			onSaveTask({
				taskId: task.id,
				problemId: problem.id,
				type: "pronunciation",
				status:
					result.pronunciationScore >= (task.payload.targetScore ?? 75)
						? "completed"
						: "practiced",
				result: {
					score: result.pronunciationScore,
					transcript: result.transcript,
					accuracyScore: result.accuracyScore ?? null,
					fluencyScore: result.fluencyScore ?? null,
					completenessScore: result.completenessScore ?? null,
					prosodyScore: result.prosodyScore ?? null,
					audioUrl: result.audioUrl ?? null,
				},
			});
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to assess pronunciation",
			);
		} finally {
			setIsAssessing(false);
		}
	};

	return (
		<div className="rounded-2xl border bg-white p-5 shadow-sm">
			<div className="mb-3 flex items-start justify-between gap-3">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<CorrectionBadge type={problem.type} />
						<TaskStatusBadge status={attemptStatus} />
					</div>
					<h3 className="font-semibold text-base">{problem.title}</h3>
				</div>
				{currentScore != null ? (
					<div className="rounded-full bg-neutral-100 px-3 py-1 font-semibold text-sm">
						{currentScore}
					</div>
				) : null}
			</div>

			<div className="grid gap-3 md:grid-cols-2">
				<div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
					<p className="mb-1 font-medium text-[11px] text-red-500 uppercase tracking-wide">
						You said
					</p>
					<p className="text-sm leading-relaxed">{problem.sourceText}</p>
				</div>
				<div className="rounded-xl border border-green-100 bg-green-50/70 p-4">
					<p className="mb-1 font-medium text-[11px] text-green-600 uppercase tracking-wide">
						Try instead
					</p>
					<p className="text-sm leading-relaxed">{problem.suggestedText}</p>
				</div>
			</div>

			<p className="mt-3 text-muted-foreground text-sm leading-relaxed">
				{problem.explanation}
			</p>

			{task?.prompt ? (
				<div className="mt-4 rounded-xl bg-neutral-50 p-4">
					<p className="font-medium text-sm">{task.prompt}</p>
					{problem.type === "pronunciation" ? (
						<div className="mt-3 space-y-3">
							<div className="flex flex-wrap items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									className="rounded-xl"
									onClick={() => onSpeak(pronunciationTarget ?? practiceText)}
								>
									<Volume2 className="mr-1 size-4" />
									Listen
								</Button>
								<Button
									size="sm"
									className="rounded-xl"
									onClick={() => {
										if (isRecording) {
											void assessPronunciation();
											return;
										}
										void startRecording();
									}}
									disabled={isAssessing}
								>
									{isRecording ? (
										<>
											<Loader2 className="mr-1 size-4 animate-pulse" />
											Stop & score
										</>
									) : isAssessing ? (
										<>
											<Loader2 className="mr-1 size-4 animate-spin" />
											Scoring
										</>
									) : (
										<>
											<Mic className="mr-1 size-4" />
											Practice
										</>
									)}
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="rounded-xl"
									onClick={() =>
										task &&
										onSaveTask({
											taskId: task.id,
											problemId: problem.id,
											type: "pronunciation",
											status: "skipped",
											result: { skipped: true },
										})
									}
								>
									<SkipForward className="mr-1 size-4" />
									Skip
								</Button>
							</div>
							{localTranscript ? (
								<p className="text-muted-foreground text-xs">
									Heard: {localTranscript}
								</p>
							) : null}
						</div>
					) : (
						<div className="mt-3 flex flex-wrap items-center gap-2">
							<Button
								size="sm"
								className="rounded-xl"
								onClick={() =>
									task &&
									onSaveTask({
										taskId: task.id,
										problemId: problem.id,
										type: problem.type,
										status: "practiced",
										result: {
											practiceText,
										},
									})
								}
							>
								<CheckCircle2 className="mr-1 size-4" />
								Practice
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="rounded-xl"
								onClick={() => onSpeak(practiceText)}
							>
								<Volume2 className="mr-1 size-4" />
								Listen
							</Button>
							<Button
								variant="ghost"
								size="sm"
								className="rounded-xl"
								onClick={() =>
									task &&
									onSaveTask({
										taskId: task.id,
										problemId: problem.id,
										type: problem.type,
										status: "skipped",
										result: { skipped: true },
									})
								}
							>
								<SkipForward className="mr-1 size-4" />
								Skip
							</Button>
						</div>
					)}
				</div>
			) : null}

			{problem.type !== "pronunciation" ? (
				<div className="mt-4 flex flex-wrap gap-2">
					{vocabularyCandidates.map((item) => {
						const mode =
							item.trim().split(/\s+/).length > 1 ? "phrase" : "word";
						return (
							<Button
								key={item}
								variant="outline"
								size="sm"
								className="rounded-xl"
								onClick={() => onAddVocabulary(item, mode)}
							>
								{mode === "phrase" ? "Add phrase" : "Add word"}: {item}
							</Button>
						);
					})}
					{problem.suggestedText.trim().split(/\s+/).length > 1 ? (
						<Button
							variant="outline"
							size="sm"
							className="rounded-xl"
							onClick={() => onAddVocabulary(problem.suggestedText, "phrase")}
						>
							Add phrase: {problem.suggestedText}
						</Button>
					) : null}
				</div>
			) : null}

			{attempt?.updatedAt ? (
				<p className="mt-3 text-muted-foreground text-xs">
					Last updated {formatRelativeDate(new Date(attempt.updatedAt))}
				</p>
			) : null}
		</div>
	);
}

export function LoadingState() {
	const [activeStep, setActiveStep] = useState(0);

	useEffect(() => {
		const timers = STEPS.map((step, i) =>
			setTimeout(() => setActiveStep(i), step.delay),
		);
		return () => timers.forEach(clearTimeout);
	}, []);

	return (
		<div className="flex min-h-dvh flex-col items-center justify-center bg-neutral-50 p-6">
			<div className="w-full max-w-md space-y-8">
				<div className="space-y-2 text-center">
					<h1 className="font-bold text-2xl tracking-tight">
						Analyzing Your Session
					</h1>
					<p className="text-muted-foreground text-sm">
						We're evaluating your conversation performance. This takes about 15
						seconds.
					</p>
				</div>

				<div className="space-y-3">
					{STEPS.map((step, i) => {
						const Icon = step.icon;
						const status =
							i < activeStep
								? "completed"
								: i === activeStep
									? "active"
									: "pending";
						return (
							<div
								key={step.id}
								className={cn(
									"flex items-center gap-3 rounded-lg border p-3 transition-all duration-300",
									status === "active" && "border-lime-500/50 bg-lime-50",
									status === "completed" && "border-green-500/30 bg-green-50",
									status === "pending" && "border-transparent opacity-50",
								)}
							>
								<div
									className={cn(
										"flex size-8 items-center justify-center rounded-full",
										status === "active" && "bg-lime-100 text-lime-600",
										status === "completed" && "bg-green-100 text-green-600",
										status === "pending" && "bg-muted text-muted-foreground",
									)}
								>
									{status === "active" ? (
										<Loader2 className="size-4 animate-spin" />
									) : status === "completed" ? (
										<Check className="size-4" />
									) : (
										<Icon className="size-4" />
									)}
								</div>
								<span
									className={cn(
										"font-medium text-sm",
										status === "completed" && "text-green-700",
										status === "pending" && "text-muted-foreground",
									)}
								>
									{step.label}
								</span>
							</div>
						);
					})}
				</div>
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
	const sessionId = session?.id ?? "";
	const [vocabMode, setVocabMode] = useState<"off" | "word" | "phrase">("off");
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

	const scores = [
		{ label: "Grammar", score: review?.scores.grammar ?? null, icon: BookOpen },
		{
			label: "Vocabulary",
			score: review?.scores.vocabulary ?? null,
			icon: MessageSquare,
		},
		{
			label: "Pronunciation",
			score: review?.scores.pronunciation ?? null,
			icon: Mic,
		},
	].filter((item) => item.score != null) as Array<{
		label: string;
		score: number;
		icon: typeof BookOpen;
	}>;
	const isPreviewLocked = reportAccess.locked && reportAccess.preview;
	const taskMap = useMemo(
		() => new Map((review?.tasks ?? []).map((task) => [task.problemId, task])),
		[review?.tasks],
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
							<p className="text-muted-foreground text-sm">
								{formatRelativeDate(new Date(session?.createdAt ?? new Date()))}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						{isPreviewLocked && (
							<span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-[11px] text-amber-700 uppercase tracking-wide">
								Preview
							</span>
						)}
					</div>
				</div>

				<div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
					<div className="space-y-6">
						<div className="grid gap-4 xl:grid-cols-[220px_repeat(3,minmax(0,1fr))]">
							<div className="rounded-2xl border bg-white p-5 shadow-sm">
								<div className="mb-3 flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
									<TrendingUp className="size-4" />
									Overall
								</div>
								{review?.overallScore != null ? (
									<div className="flex items-center gap-4">
										<ScoreRing
											score={review.overallScore}
											size={88}
											strokeWidth={7}
										/>
										<div>
											<p className="font-semibold">Session score</p>
											<p className="text-muted-foreground text-sm">
												{review.overallScore >= 80
													? "Strong session"
													: review.overallScore >= 60
														? "Good progress"
														: "More targeted practice will help"}
											</p>
										</div>
									</div>
								) : (
									<p className="text-muted-foreground text-sm">
										No score yet for this session.
									</p>
								)}
							</div>

							<div className="rounded-2xl border bg-white p-5 shadow-sm xl:col-span-3">
								<div className="mb-4 flex items-center justify-between gap-3">
									<div>
										<p className="font-semibold">Practice progress</p>
										<p className="text-muted-foreground text-sm">
											Practiced {practiceProgress.practicedTasks} of{" "}
											{practiceProgress.totalTasks} tasks
										</p>
									</div>
									<div className="rounded-full bg-lime-100 px-3 py-1 font-semibold text-lime-700 text-sm">
										{practiceProgress.completedTasks} completed
									</div>
								</div>
								<div className="grid gap-3 sm:grid-cols-3">
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
								</div>
							</div>
						</div>

						<div className="space-y-4">
							<div className="flex items-center justify-between gap-3">
								<div>
									<h2 className="font-semibold text-lg">Problems to fix</h2>
									<p className="text-muted-foreground text-sm">
										Fast tasks based on grammar, vocabulary, and pronunciation.
									</p>
								</div>
								{saveTaskResult.isPending ? (
									<Loader2 className="size-4 animate-spin text-muted-foreground" />
								) : null}
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
										This session did not surface clear high-priority fixes. Use
										the transcript tools on the right to save helpful words and
										phrases.
									</p>
								</div>
							) : null}

							{review?.problems.map((problem) => (
								<ReviewTaskCard
									key={problem.id}
									problem={problem}
									task={taskMap.get(problem.id)}
									attempt={attemptMap.get(taskMap.get(problem.id)?.id ?? "")}
									onSaveTask={handleSaveTask}
									onAddVocabulary={(text, mode) =>
										addVocabulary({ text, mode })
									}
									onSpeak={speak}
								/>
							))}
						</div>
					</div>

					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="font-semibold text-lg">Transcript</h2>
							</div>
							<VocabModeToggle value={vocabMode} onChange={setVocabMode} />
						</div>

						<div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
							<div className="max-h-[calc(100vh-180px)] space-y-6 overflow-y-auto p-6">
								{messages.map((msg) => (
									<TranscriptMessage
										key={msg.id}
										sessionId={sessionId}
										content={msg.content}
										role={msg.role as "user" | "assistant"}
										vocabMode={vocabMode}
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
