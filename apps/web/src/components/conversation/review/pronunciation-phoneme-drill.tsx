import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Matches `ConversationReviewTask.payload.phonemeGroups` from session review. */
export type PhonemeDrillGroup = {
	phoneme: string;
	displayLabel?: string;
	words: Array<{
		word: string;
		score: number;
		highlightIndex: number;
		highlightEndIndex?: number;
	}>;
};

export function ScoreTierPill({ score }: { score: number }) {
	const tier =
		score < 40
			? "bg-red-500/95 text-white"
			: score < 60
				? "bg-orange-500/95 text-white"
				: score < 80
					? "bg-amber-400/95 text-neutral-900"
					: "bg-emerald-500/95 text-white";
	return (
		<span
			className={cn(
				"shrink-0 rounded-full px-2 py-0.5 font-semibold text-[11px] tabular-nums",
				tier,
			)}
		>
			{score}%
		</span>
	);
}

export function HighlightedWordText({
	word,
	highlightIndex,
	highlightEndIndex,
}: {
	word: string;
	highlightIndex: number;
	/** Inclusive UTF-16 end index; omit for a single grapheme at `highlightIndex`. */
	highlightEndIndex?: number;
}) {
	const w = word.normalize("NFC");
	const last = Math.max(0, w.length - 1);
	const start = Math.min(Math.max(0, highlightIndex), last);
	const end = Math.min(Math.max(start, highlightEndIndex ?? start), last);
	const before = w.slice(0, start);
	const mid = w.slice(start, end + 1);
	const after = w.slice(end + 1);
	return (
		<span className="font-medium text-[15px] tracking-tight">
			{before}
			<span className="text-[#8ade4b]">{mid}</span>
			{after}
		</span>
	);
}

/**
 * Azure-style weak phoneme sections: each sound groups words to mini-practice,
 * with score badges and per-word selection for recording.
 */
export function PronunciationPhonemeDrill({
	groups,
	wordDrills,
	activeDrillWord,
	onSelectWord,
	className,
}: {
	groups: PhonemeDrillGroup[];
	wordDrills: Record<string, { score?: number }>;
	activeDrillWord: string | null;
	onSelectWord: (word: string) => void;
	className?: string;
}) {
	if (groups.length === 0) return null;

	return (
		<div
			className={cn(
				"space-y-5 rounded-2xl border bg-white p-4 text-neutral-300",
				className,
			)}
		>
			{groups.map((group) => (
				<div key={group.phoneme} className="space-y-2">
					<p className="font-medium text-neutral-400 text-sm">
						{group.displayLabel ??
							(group.phoneme &&
							group.phoneme !== "_target" &&
							!group.phoneme.startsWith("err:")
								? group.phoneme.startsWith("/") &&
									group.phoneme.endsWith("/")
									? `Sound ${group.phoneme}`
									: `Sound /${group.phoneme.replace(/^\/|\/$/g, "")}/`
								: "Practice word")}
					</p>
					<ul className="space-y-2">
						{group.words.map((row) => {
							const practiced = wordDrills[row.word]?.score;
							const displayScore =
								typeof practiced === "number"
									? Math.round(practiced)
									: row.score;
							const selected = activeDrillWord === row.word;
							return (
								<li key={`${group.phoneme}-${row.word}`}>
									<button
										type="button"
										onClick={() => onSelectWord(row.word)}
										className={cn(
											"flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-gray-500 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/60",
											selected && "ring-2 ring-primary/25",
										)}
									>
										<div className="min-w-0 flex-1">
											<HighlightedWordText
												word={row.word}
												highlightIndex={row.highlightIndex}
												highlightEndIndex={row.highlightEndIndex}
											/>
										</div>
										<ScoreTierPill score={displayScore} />
										<ChevronRight className="size-4 shrink-0 text-neutral-500" />
									</button>
								</li>
							);
						})}
					</ul>
				</div>
			))}
		</div>
	);
}
