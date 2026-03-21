import type { ReactNode } from "react";
import type { TranscriptHighlight } from "@/lib/conversation-review-ui";
import { cn } from "@/lib/utils";

const kindClass: Record<TranscriptHighlight["kind"], string> = {
	grammar:
		"bg-amber-100/95 font-medium text-amber-950 underline decoration-amber-600 decoration-2 underline-offset-2 dark:bg-amber-950/40 dark:text-amber-100 dark:decoration-amber-400",
	vocabulary:
		"bg-violet-100/95 font-medium text-violet-950 underline decoration-violet-600 decoration-2 underline-offset-2 dark:bg-violet-950/45 dark:text-violet-100 dark:decoration-violet-400",
	pronunciation:
		"bg-sky-100/95 font-medium text-sky-950 underline decoration-sky-600 decoration-2 underline-offset-2 dark:bg-sky-950/45 dark:text-sky-100 dark:decoration-sky-400",
};

function clamp(n: number, min: number, max: number) {
	return Math.min(max, Math.max(min, n));
}

function pickHighlightForSegment(
	covering: TranscriptHighlight[],
): TranscriptHighlight | null {
	if (covering.length === 0) return null;
	const order: TranscriptHighlight["kind"][] = [
		"grammar",
		"vocabulary",
		"pronunciation",
	];
	const sortedCovering = [...covering].sort(
		(a, b) => order.indexOf(a.kind) - order.indexOf(b.kind),
	);
	return sortedCovering[0] ?? null;
}

export function TranscriptHighlightedText({
	text,
	highlights,
}: {
	text: string;
	highlights: TranscriptHighlight[];
}): ReactNode {
	if (!highlights.length) {
		return <span className="whitespace-pre-wrap">{text}</span>;
	}

	const n = text.length;
	const breakpoints = new Set<number>([0, n]);
	for (const h of highlights) {
		breakpoints.add(clamp(h.start, 0, n));
		breakpoints.add(clamp(h.end, 0, n));
	}
	const sorted = [...breakpoints].sort((a, b) => a - b);
	const parts: ReactNode[] = [];

	for (let i = 0; i < sorted.length - 1; i++) {
		const start = sorted[i];
		const end = sorted[i + 1];
		if (start === undefined || end === undefined) continue;
		if (start >= end) continue;
		const slice = text.slice(start, end);
		const covering = highlights.filter((h) => h.start < end && h.end > start);
		const pick = pickHighlightForSegment(covering);
		if (!pick) {
			parts.push(
				<span key={`${start}-${end}`} className="whitespace-pre-wrap">
					{slice}
				</span>,
			);
			continue;
		}
		parts.push(
			<mark
				key={`${start}-${end}-${pick.problemId}`}
				className={cn(
					"whitespace-pre-wrap rounded-sm px-0.5 font-medium",
					kindClass[pick.kind],
				)}
			>
				{slice}
			</mark>,
		);
	}

	return <span className="whitespace-pre-wrap">{parts}</span>;
}
