import type { AppRouter } from "@english.now/api/routers/index";
import { env } from "@english.now/env/client";
import type { inferRouterOutputs } from "@trpc/server";
import { CheckCircle2, Loader2, Mic, SkipForward, Volume2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import useVoiceRecorder from "@/hooks/use-voice-recorder";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/utils/date";

type ReviewResponse =
	inferRouterOutputs<AppRouter>["conversation"]["getReview"];
type ReviewData = ReviewResponse["review"];
type AttemptRow = ReviewResponse["attempts"][number];

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

export function ReviewTaskCard({
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
		<div className="w-full items-center gap-3 rounded-3xl border border-border/50 bg-white p-4 text-left transition-colors hover:border-border/80 hover:shadow-xs">
			<div className="mb-3 flex items-start justify-between gap-3">
				<div className="flex w-full justify-between">
					<h4 className="font-semibold text-sm">{problem.title}</h4>
					<div className="flex items-center gap-2">
						<CorrectionBadge type={problem.type} />
					</div>
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
