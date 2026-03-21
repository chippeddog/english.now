import type { AppRouter } from "@english.now/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";
import { Bookmark, Check, Flag, Mic, SkipForward, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";
import ReportIssueDialog from "@/components/conversation/report-issue-dialog";
import {
	IssueCardEyebrow,
	IssueCardShell,
} from "@/components/conversation/review/primitives/issue-card-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReviewProblem } from "@/types/conversation-review";

type ReviewResponse =
	inferRouterOutputs<AppRouter>["conversation"]["getReview"];
type ReviewData = ReviewResponse["review"];

function ExplanationWithBold({ text }: { text: string }) {
	const parts = text.split(/(\*\*[^*]+\*\*)/g);
	let run = 0;
	return (
		<>
			{parts.map((part) => {
				const key = `${run++}:${part.slice(0, 48)}`;
				if (part.startsWith("**") && part.endsWith("**")) {
					return (
						<strong key={key} className="font-semibold text-foreground">
							{part.slice(2, -2)}
						</strong>
					);
				}
				return <span key={key}>{part}</span>;
			})}
		</>
	);
}

export function VocabularyIssueCard({
	problem,
	task,
	sessionId,
	onSaveTask,
	onSpeak,
	onAddVocabulary,
}: {
	problem: ReviewProblem;
	task?: NonNullable<ReviewData>["tasks"][number];
	sessionId: string;
	onSaveTask: (input: {
		taskId: string;
		problemId: string;
		type: "grammar" | "vocabulary" | "pronunciation";
		status: "practiced" | "completed" | "skipped";
		result?: Record<string, unknown>;
	}) => void;
	onSpeak: (text: string) => void;
	onAddVocabulary: (text: string, mode: "word" | "phrase") => void;
}) {
	const [expandedWhy, setExpandedWhy] = useState(false);
	const [chosenPhrase, setChosenPhrase] = useState<string | null>(null);
	const [personal, setPersonal] = useState("");

	const variant = problem.practiceVariant ?? "repeat";
	const subtype = problem.skillSubtype ?? "Vocabulary";

	const phraseMode =
		problem.suggestedText.trim().split(/\s+/).length > 1 ? "phrase" : "word";

	const options = useMemo(() => {
		const main = problem.suggestedText.trim();
		const alts = (problem.alternatives ?? [])
			.map((a: string) => a.trim())
			.filter(Boolean);
		const uniq = [
			main,
			...alts.filter((a: string) => a.toLowerCase() !== main.toLowerCase()),
		];
		return uniq.slice(0, 3);
	}, [problem.suggestedText, problem.alternatives]);

	const activePhrase = chosenPhrase ?? problem.suggestedText;
	const practiceText = task?.payload.practiceText ?? activePhrase;

	const tryHint =
		variant === "personalize"
			? "Say your own sentence using this idea (type a draft if it helps)."
			: variant === "choose-option"
				? "Pick the option that fits your meaning, then say it once."
				: "Say the improved wording once, out loud.";

	return (
		<IssueCardShell>
			<IssueCardEyebrow primary="Vocabulary" secondary={subtype} />

			{problem.contextSnippet ? (
				<p className="mb-2 text-[11px] text-muted-foreground italic">
					{problem.contextSnippet}
				</p>
			) : null}

			<div className="mb-3 rounded-xl border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-950/40">
				<p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wide">
					In context
				</p>
				<p className="mt-1 text-sm leading-relaxed">
					<span className="font-medium text-violet-700 dark:text-violet-400">
						{problem.suggestedText}
					</span>
					<span className="text-muted-foreground"> · </span>
					<span className="text-rose-500 line-through decoration-rose-400/90 dark:text-rose-400">
						{problem.sourceText}
					</span>
				</p>
			</div>

			{(variant === "choose-option" || options.length > 1) && (
				<div className="mb-3 flex flex-wrap gap-2">
					{options.map((opt) => {
						const selectedPhrase = chosenPhrase ?? problem.suggestedText;
						const isSel = opt === selectedPhrase;
						return (
							<button
								key={opt}
								type="button"
								onClick={() => setChosenPhrase(opt)}
								className={cn(
									"rounded-full border px-3 py-1 font-medium text-xs transition-colors",
									isSel
										? "border-lime-500 bg-lime-50 text-lime-900 dark:bg-lime-950/40 dark:text-lime-100"
										: "border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900",
								)}
							>
								{opt}
							</button>
						);
					})}
				</div>
			)}

			{variant === "personalize" ? (
				<div className="mb-3">
					<label
						className="font-medium text-muted-foreground text-xs"
						htmlFor={`personal-${problem.id}`}
					>
						Your sentence
					</label>
					<textarea
						id={`personal-${problem.id}`}
						className="mt-1 w-full rounded-lg border border-neutral-200 bg-white p-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
						rows={2}
						value={personal}
						placeholder="e.g. I’d like to reschedule our meeting."
						onChange={(e) => setPersonal(e.target.value)}
					/>
				</div>
			) : null}

			{problem.explanation ? (
				<div className="mb-3">
					{expandedWhy ? (
						<p className="text-muted-foreground text-xs leading-relaxed">
							<ExplanationWithBold text={problem.explanation} />
						</p>
					) : (
						<p className="line-clamp-2 text-muted-foreground text-xs leading-relaxed">
							<ExplanationWithBold text={problem.explanation} />
						</p>
					)}
					<button
						type="button"
						className="mt-1 text-[11px] text-primary underline-offset-2 hover:underline"
						onClick={() => setExpandedWhy((v) => !v)}
					>
						{expandedWhy ? "Show less" : "Why this works"}
					</button>
				</div>
			) : null}

			<p className="mb-3 text-muted-foreground text-xs">{tryHint}</p>

			<div className="flex flex-wrap items-center gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="h-8 rounded-lg text-xs"
					onClick={() =>
						onSpeak(
							variant === "personalize" && personal.trim()
								? personal
								: practiceText,
						)
					}
				>
					<Volume2 className="mr-1 size-3.5" />
					Listen
				</Button>
				{task ? (
					<>
						<Button
							type="button"
							size="sm"
							className="h-8 rounded-lg border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)] px-3 font-medium text-lime-900 text-xs"
							onClick={() => {
								const text =
									variant === "personalize" && personal.trim()
										? personal.trim()
										: practiceText;
								onSaveTask({
									taskId: task.id,
									problemId: problem.id,
									type: "vocabulary",
									status: "practiced",
									result: { practiceText: text, practiceVariant: variant },
								});
								onSpeak(text);
							}}
						>
							<Mic className="mr-1 size-3.5" />
							Try it
						</Button>
						<Button
							type="button"
							variant="secondary"
							size="sm"
							className="h-8 rounded-lg text-xs"
							onClick={() =>
								onSaveTask({
									taskId: task.id,
									problemId: problem.id,
									type: "vocabulary",
									status: "completed",
									result: {
										markedDone: true,
										phrase:
											variant === "personalize" && personal.trim()
												? personal.trim()
												: activePhrase,
									},
								})
							}
						>
							<Check className="mr-1 size-3.5" />
							Got it
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-8 rounded-lg text-xs"
							onClick={() =>
								onSaveTask({
									taskId: task.id,
									problemId: problem.id,
									type: "vocabulary",
									status: "skipped",
									result: { skipped: true },
								})
							}
						>
							<SkipForward className="mr-1 size-3.5" />
							Skip
						</Button>
					</>
				) : null}
				<div className="ml-auto flex items-center gap-1">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-8 text-muted-foreground"
						onClick={() => onAddVocabulary(activePhrase, phraseMode)}
						aria-label="Save phrase"
					>
						<Bookmark className="size-4" />
					</Button>
					<ReportIssueDialog sessionId={sessionId} sessionType="conversation">
						<button
							type="button"
							className="inline-flex size-8 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-muted-foreground text-xs transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900"
							aria-label="Report issue"
						>
							<Flag className="size-3.5" strokeWidth={2} />
						</button>
					</ReportIssueDialog>
				</div>
			</div>

			<p className="mt-3 border-neutral-100 border-t pt-3 text-muted-foreground text-xs dark:border-neutral-800">
				<span className="font-medium text-foreground">Use this next time:</span>{" "}
				{variant === "personalize" && personal.trim()
					? personal.trim()
					: activePhrase}
			</p>
		</IssueCardShell>
	);
}
