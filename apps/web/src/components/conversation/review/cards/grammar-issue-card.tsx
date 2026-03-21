import type { AppRouter } from "@english.now/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";
import { Check, Flag, Mic, SkipForward, Volume2 } from "lucide-react";
import { useState } from "react";
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

type PracticeVariant = NonNullable<ReviewProblem["practiceVariant"]>;

const practiceCopy: Record<
	PracticeVariant,
	{ tryLabel: string; hint: string }
> = {
	repeat: {
		tryLabel: "Try it",
		hint: "Say the corrected sentence once, out loud.",
	},
	"question-transform": {
		tryLabel: "Try it",
		hint: "Turn the idea into a clear question in English.",
	},
	"fill-blank": {
		tryLabel: "Try it",
		hint: "Say the full sentence with the missing piece filled in.",
	},
	"choose-option": {
		tryLabel: "Try it",
		hint: "Pick the best option, then say it.",
	},
	personalize: { tryLabel: "Try it", hint: "Say your version out loud." },
};

export function GrammarIssueCard({
	problem,
	task,
	sessionId,
	onSaveTask,
	onSpeak,
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
}) {
	const [expandedWhy, setExpandedWhy] = useState(false);
	const variant = problem.practiceVariant ?? "repeat";
	const copy = practiceCopy[variant] ?? practiceCopy.repeat;
	const practiceText =
		task?.payload.practiceText ?? problem.suggestedText ?? problem.sourceText;
	const subtype = problem.skillSubtype ?? "Grammar fix";

	return (
		<IssueCardShell>
			<IssueCardEyebrow primary="Grammar" secondary={subtype} />

			{problem.contextSnippet ? (
				<p className="mb-2 text-[11px] text-muted-foreground italic">
					{problem.contextSnippet}
				</p>
			) : null}

			<div className="mb-3 space-y-2 rounded-xl border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-950/40">
				<div>
					<p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wide">
						You said
					</p>
					<p className="mt-0.5 font-medium text-foreground text-sm leading-relaxed">
						{problem.sourceText}
					</p>
				</div>
				<div>
					<p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wide">
						Better option
					</p>
					<p className="mt-0.5 font-semibold text-sm text-teal-700 leading-relaxed dark:text-teal-400">
						{problem.suggestedText}
					</p>
				</div>
			</div>

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

			<p className="mb-3 text-muted-foreground text-xs">{copy.hint}</p>

			<div className="flex flex-wrap items-center gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="h-8 rounded-lg text-xs"
					onClick={() => onSpeak(practiceText)}
				>
					<Volume2 className="mr-1 size-3.5" />
					Listen
				</Button>
				{task ? (
					<>
						<Button
							type="button"
							size="sm"
							className="h-8 rounded-lg bg-linear-to-b from-orange-500 to-orange-600 px-3 text-white text-xs hover:from-orange-500/95 hover:to-orange-600/95"
							onClick={() => {
								onSaveTask({
									taskId: task.id,
									problemId: problem.id,
									type: "grammar",
									status: "practiced",
									result: { practiceText, practiceVariant: variant },
								});
								onSpeak(practiceText);
							}}
						>
							<Mic className="mr-1 size-3.5" />
							{copy.tryLabel}
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
									type: "grammar",
									status: "completed",
									result: { markedDone: true, practiceVariant: variant },
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
									type: "grammar",
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
				<div className="ml-auto">
					<ReportIssueDialog sessionId={sessionId} sessionType="conversation">
						<button
							type="button"
							className={cn(
								"inline-flex size-8 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-muted-foreground text-xs transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900",
							)}
							aria-label="Report issue"
						>
							<Flag className="size-3.5" strokeWidth={2} />
						</button>
					</ReportIssueDialog>
				</div>
			</div>
		</IssueCardShell>
	);
}
