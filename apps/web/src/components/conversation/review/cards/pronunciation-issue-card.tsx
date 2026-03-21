import type { AppRouter } from "@english.now/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";
import { Loader2, Mic, SkipForward, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import ReportIssueDialog from "@/components/conversation/report-issue-dialog";
import {
	IssueCardEyebrow,
	IssueCardShell,
} from "@/components/conversation/review/primitives/issue-card-shell";
import { ReviewTaskCard } from "@/components/conversation/review/review-task-card";
import { Button } from "@/components/ui/button";
import { usePronunciationAssess } from "@/hooks/use-pronunciation-assess";
import useVoiceRecorder from "@/hooks/use-voice-recorder";
import { isLegacyPronunciationBundle } from "@/lib/conversation-review-ui";
import { cn } from "@/lib/utils";
import type { ReviewProblem } from "@/types/conversation-review";
import {
	type PhonemeDrillGroup,
	PronunciationPhonemeDrill,
} from "../pronunciation-phoneme-drill";

type ReviewResponse =
	inferRouterOutputs<AppRouter>["conversation"]["getReview"];
type ReviewData = ReviewResponse["review"];
type AttemptRow = ReviewResponse["attempts"][number];

type PronunciationTaskPayload =
	NonNullable<ReviewData>["tasks"][number]["payload"] & {
		phonemeGroups?: PhonemeDrillGroup[];
	};

function readWordDrills(attempt?: AttemptRow) {
	const raw = attempt?.result?.wordDrills;
	if (!raw || typeof raw !== "object")
		return {} as Record<string, { score?: number }>;
	return raw as Record<string, { score?: number }>;
}

function pickHighlightIndex(word: string, index?: number) {
	if (typeof index === "number" && !Number.isNaN(index)) {
		const w = word.normalize("NFC");
		return Math.min(Math.max(0, index), Math.max(0, w.length - 1));
	}
	const w = word.normalize("NFC");
	if (w.length <= 1) return 0;
	return Math.min(Math.floor(w.length / 2), w.length - 1);
}

function isGenericPronunciationLabel(s: string | undefined): boolean {
	return !s?.trim() || /^pronunciation$/i.test(s.trim());
}

/** Avoid "Pronunciation | Pronunciation"; prefer Azure-style "Sound /n/". */
function pronunciationCardEyebrowSecondary(
	groups: PhonemeDrillGroup[],
	target:
		| NonNullable<ReviewProblem["pronunciationTargets"]>[number]
		| undefined,
	problem: ReviewProblem,
): string {
	const g0 = groups[0];
	if (g0?.displayLabel && !isGenericPronunciationLabel(g0.displayLabel)) {
		return g0.displayLabel.trim();
	}
	const rawPhoneme = g0?.phoneme?.trim() ?? "";
	if (
		rawPhoneme &&
		rawPhoneme !== "_target" &&
		!rawPhoneme.startsWith("err:")
	) {
		return rawPhoneme.startsWith("/") && rawPhoneme.endsWith("/")
			? `Sound ${rawPhoneme}`
			: `Sound /${rawPhoneme.replace(/^\/|\/$/g, "")}/`;
	}
	if (target?.soundLabel && !isGenericPronunciationLabel(target.soundLabel)) {
		return target.soundLabel.trim();
	}
	if (
		problem.skillSubtype &&
		!isGenericPronunciationLabel(problem.skillSubtype)
	) {
		return problem.skillSubtype.trim();
	}
	return "Weak sound";
}

const practiceGradientBtn =
	"group inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)] px-3 py-1 font-medium text-lime-900 text-xs shadow-none transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

function PronunciationSingleIssueCard({
	problem,
	task,
	attempt,
	sessionId,
	onSaveTask,
	onSpeak,
}: {
	problem: ReviewProblem;
	task: NonNullable<ReviewData>["tasks"][number];
	attempt?: AttemptRow;
	sessionId: string;
	onSaveTask: (input: {
		taskId: string;
		problemId: string;
		type: "grammar" | "vocabulary" | "pronunciation";
		status: "practiced" | "completed" | "skipped";
		result?: Record<string, unknown>;
	}) => void;
	onSpeak: (text: string) => void;
}) {
	const { isRecording, startRecording, stopRecording } = useVoiceRecorder();
	const { isAssessing, assess } = usePronunciationAssess();
	const [localScore, setLocalScore] = useState<number | null>(null);
	const [localTranscript, setLocalTranscript] = useState<string | null>(null);
	const [activeDrillWord, setActiveDrillWord] = useState<string | null>(null);

	const payloadPhonemeGroups = (task.payload as PronunciationTaskPayload)
		.phonemeGroups;

	const effectivePhonemeGroups = useMemo((): PhonemeDrillGroup[] => {
		if (payloadPhonemeGroups && payloadPhonemeGroups.length > 0) {
			return payloadPhonemeGroups;
		}
		const t = problem.pronunciationTargets?.[0];
		if (t?.text) {
			const word = t.text.trim();
			const fallbackLabel =
				t.soundLabel && !isGenericPronunciationLabel(t.soundLabel)
					? t.soundLabel
					: problem.skillSubtype &&
							!isGenericPronunciationLabel(problem.skillSubtype)
						? problem.skillSubtype
						: undefined;
			return [
				{
					phoneme: "_target",
					displayLabel: fallbackLabel,
					words: [
						{
							word,
							score: Math.round(
								typeof t.score === "number" && !Number.isNaN(t.score)
									? t.score
									: 72,
							),
							highlightIndex: pickHighlightIndex(word, t.highlightIndex),
							...(typeof t.highlightEndIndex === "number"
								? { highlightEndIndex: t.highlightEndIndex }
								: {}),
						},
					],
				},
			];
		}
		return [];
	}, [
		payloadPhonemeGroups,
		problem.pronunciationTargets,
		problem.skillSubtype,
	]);

	const flatWordCount = effectivePhonemeGroups.reduce(
		(n, g) => n + g.words.length,
		0,
	);

	const impliedSingleWord =
		flatWordCount === 1
			? (effectivePhonemeGroups[0]?.words[0]?.word ?? null)
			: null;
	const selectedDrillWord = activeDrillWord ?? impliedSingleWord;

	const practiceText =
		task.payload.practiceText ?? problem.suggestedText ?? problem.sourceText;
	const pronunciationTarget =
		task.payload.pronunciationTarget ??
		problem.pronunciationTargets?.[0]?.text ??
		problem.suggestedText;

	const referenceForAssessment =
		flatWordCount > 0
			? (selectedDrillWord ?? pronunciationTarget ?? practiceText)
			: (pronunciationTarget ?? practiceText);

	const target = task.payload.targetScore ?? 75;
	const attemptScore =
		typeof attempt?.result?.score === "number" ? attempt.result.score : null;
	const currentScore = localScore ?? attemptScore;

	const word = problem.pronunciationTargets?.[0];
	const subtype = pronunciationCardEyebrowSecondary(
		effectivePhonemeGroups,
		word,
		problem,
	);

	const flowStep = useMemo(() => {
		if (isRecording) return "recording" as const;
		if (isAssessing) return "scoring" as const;
		if (localScore != null) return "result" as const;
		return "idle" as const;
	}, [isRecording, isAssessing, localScore]);

	const assessAndSave = async () => {
		const blob = await stopRecording();
		if (!blob) return;
		if (!referenceForAssessment) {
			toast.message("Choose a word", {
				description: "Tap a word in the list if there are multiple targets.",
			});
			return;
		}
		try {
			const result = await assess(blob, referenceForAssessment);
			setLocalScore(result.pronunciationScore);
			setLocalTranscript(result.transcript);

			const practicedWord = referenceForAssessment;
			const prevDrills = readWordDrills(attempt);
			const wordDrills =
				flatWordCount > 0
					? {
							...prevDrills,
							[practicedWord]: {
								score: result.pronunciationScore,
								transcript: result.transcript,
								accuracyScore: result.accuracyScore ?? null,
								fluencyScore: result.fluencyScore ?? null,
								completenessScore: result.completenessScore ?? null,
								prosodyScore: result.prosodyScore ?? null,
								audioUrl: result.audioUrl ?? null,
							},
						}
					: undefined;

			onSaveTask({
				taskId: task.id,
				problemId: problem.id,
				type: "pronunciation",
				status: result.pronunciationScore >= target ? "completed" : "practiced",
				result: {
					score: result.pronunciationScore,
					transcript: result.transcript,
					accuracyScore: result.accuracyScore ?? null,
					fluencyScore: result.fluencyScore ?? null,
					completenessScore: result.completenessScore ?? null,
					prosodyScore: result.prosodyScore ?? null,
					audioUrl: result.audioUrl ?? null,
					lastPracticedWord: practicedWord,
					...(wordDrills ? { wordDrills } : {}),
				},
			});
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Assessment failed");
		}
	};

	const wordDrills = readWordDrills(attempt);
	const needPickWord = flatWordCount > 1 && !activeDrillWord;
	const listenText = selectedDrillWord ?? pronunciationTarget ?? practiceText;
	const hasDrillList = effectivePhonemeGroups.length > 0;
	const showPhonemeDrillList = hasDrillList;

	if (!hasDrillList) {
		return (
			<IssueCardShell>
				<IssueCardEyebrow primary="Pronunciation" secondary={subtype} />
				<p className="text-muted-foreground text-sm">
					No word-level pronunciation target for this card. Try speaking with
					voice next session.
				</p>
				<div className="mt-3 flex flex-wrap gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-8 text-xs"
						onClick={() =>
							onSaveTask({
								taskId: task.id,
								problemId: problem.id,
								type: "pronunciation",
								status: "skipped",
								result: { skipped: true, reason: "no_target" },
							})
						}
					>
						Skip
					</Button>
				</div>
			</IssueCardShell>
		);
	}

	return (
		<IssueCardShell>
			<div className="mb-3 flex items-start justify-between gap-2">
				<div className="min-w-0 flex-1">
					<IssueCardEyebrow primary="Pronunciation" secondary={subtype} />
				</div>
				{currentScore != null ? (
					<span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-0.5 font-semibold text-sm tabular-nums dark:bg-neutral-800">
						{currentScore}
					</span>
				) : null}
			</div>

			{showPhonemeDrillList ? (
				<PronunciationPhonemeDrill
					className="mb-3 border-neutral-200 dark:border-neutral-700"
					groups={effectivePhonemeGroups}
					wordDrills={wordDrills}
					activeDrillWord={selectedDrillWord}
					onSelectWord={(selectedWord: string) => {
						setActiveDrillWord(selectedWord);
						setLocalTranscript(null);
						setLocalScore(null);
					}}
				/>
			) : null}

			<p className="mb-2 text-muted-foreground text-xs">
				{flowStep === "idle" && "Listen → Record → Get your score."}
				{flowStep === "recording" && "Recording… tap again to stop."}
				{flowStep === "scoring" && "Scoring your clip…"}
				{flowStep === "result" &&
					(currentScore != null && currentScore >= target
						? "Nice — that target sound is clearer."
						: "Close — try once more, a bit slower.")}
			</p>

			<div className="flex flex-wrap items-center gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="h-8 rounded-lg text-xs"
					disabled={needPickWord}
					onClick={() => {
						if (needPickWord) {
							toast.message("Pick a word", {
								description: "Select a row above first.",
							});
							return;
						}
						onSpeak(listenText);
					}}
				>
					<Volume2 className="mr-1 size-3.5" />
					Listen
				</Button>
				<button
					type="button"
					className={cn(practiceGradientBtn)}
					disabled={isAssessing || needPickWord}
					onClick={() => {
						if (isRecording) {
							void assessAndSave();
							return;
						}
						void startRecording();
					}}
				>
					{isRecording ? (
						<>
							<Loader2 className="size-3 animate-pulse" />
							Stop & score
						</>
					) : isAssessing ? (
						<>
							<Loader2 className="size-3 animate-spin" />
							Scoring
						</>
					) : flowStep === "result" &&
						currentScore != null &&
						currentScore < target ? (
						<>
							<Mic className="size-3" />
							Try again
						</>
					) : (
						<>
							<Mic className="size-3" strokeWidth={2} />
							Record
						</>
					)}
				</button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="h-8 rounded-lg text-xs"
					onClick={() =>
						onSaveTask({
							taskId: task.id,
							problemId: problem.id,
							type: "pronunciation",
							status: "skipped",
							result: { skipped: true },
						})
					}
				>
					<SkipForward className="mr-1 size-3.5" />
					Skip
				</Button>
				<div className="ml-auto">
					<ReportIssueDialog sessionId={sessionId} sessionType="conversation" />
				</div>
			</div>
			{localTranscript ? (
				<p className="mt-2 text-muted-foreground text-xs">
					Heard: {localTranscript}
				</p>
			) : null}
		</IssueCardShell>
	);
}

export function PronunciationIssueCard({
	problem,
	task,
	attempt,
	sessionId,
	onSaveTask,
	onAddVocabulary,
	onSpeak,
}: {
	problem: ReviewProblem;
	task?: NonNullable<ReviewData>["tasks"][number];
	attempt?: AttemptRow;
	sessionId: string;
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
	if (isLegacyPronunciationBundle(problem, task)) {
		return (
			<ReviewTaskCard
				problem={problem}
				task={task}
				attempt={attempt}
				onSaveTask={onSaveTask}
				onAddVocabulary={onAddVocabulary}
				onSpeak={onSpeak}
			/>
		);
	}

	if (!task) {
		return (
			<IssueCardShell>
				<IssueCardEyebrow primary="Pronunciation" secondary="Practice" />
				<p className="text-muted-foreground text-sm">
					No practice task linked.
				</p>
			</IssueCardShell>
		);
	}

	return (
		<PronunciationSingleIssueCard
			problem={problem}
			task={task}
			attempt={attempt}
			sessionId={sessionId}
			onSaveTask={onSaveTask}
			onSpeak={onSpeak}
		/>
	);
}
