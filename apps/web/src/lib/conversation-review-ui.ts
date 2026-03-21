import type { ReviewProblem } from "@/types/conversation-review";

export type ReviewHighlightKind = "grammar" | "vocabulary" | "pronunciation";

export type TranscriptHighlight = {
	start: number;
	end: number;
	kind: ReviewHighlightKind;
	problemId: string;
};

const severityRank = { high: 0, medium: 1, low: 2 } as const;

/** Prefer distinct skillSubtype early, then fill remaining slots. */
export function queueIssuesByPriority<
	T extends {
		id: string;
		severity: keyof typeof severityRank;
		skillSubtype?: string;
	},
>(items: T[], maxVisible: number): { shown: T[]; rest: T[] } {
	const sorted = [...items].sort(
		(a, b) => severityRank[a.severity] - severityRank[b.severity],
	);
	const shown: T[] = [];
	const usedSubtype = new Set<string>();
	for (const p of sorted) {
		if (shown.length >= maxVisible) break;
		const key = (p.skillSubtype ?? "").trim().toLowerCase() || p.id;
		if (usedSubtype.has(key)) continue;
		usedSubtype.add(key);
		shown.push(p);
	}
	for (const p of sorted) {
		if (shown.length >= maxVisible) break;
		if (shown.some((s) => s.id === p.id)) continue;
		shown.push(p);
	}
	const rest = sorted.filter((p) => !shown.some((s) => s.id === p.id));
	return { shown, rest };
}

export function findUtf16SpanInText(
	haystack: string,
	needle: string,
): { start: number; end: number } | null {
	const t = needle.trim();
	if (!t) return null;
	let idx = haystack.indexOf(t);
	if (idx >= 0) return { start: idx, end: idx + t.length };
	const hl = haystack.toLowerCase();
	const tl = t.toLowerCase();
	idx = hl.indexOf(tl);
	if (idx < 0) return null;
	const end = idx + t.length;
	if (haystack.slice(idx, end).toLowerCase() !== tl) return null;
	return { start: idx, end };
}

export function findWordUtf16Span(
	sentence: string,
	word: string,
): { start: number; end: number } | null {
	const w = word.trim();
	if (!w) return null;
	const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const re = new RegExp(`\\b${escaped}\\b`, "i");
	const m = re.exec(sentence);
	if (!m || m.index === undefined) return null;
	return { start: m.index, end: m.index + m[0].length };
}

function resolvePronunciationTargetInMessage(
	target: NonNullable<ReviewProblem["pronunciationTargets"]>[number],
	problem: ReviewProblem,
	messageId: string,
	messageContent: string,
): { start: number; end: number } | null {
	const span = target.transcriptSpan;
	if (span?.messageId === messageId && span.end > span.start) {
		return { start: span.start, end: span.end };
	}
	const anchor = target.messageId ?? problem.messageId;
	if (anchor !== messageId) return null;
	const w = target.text?.trim();
	if (w) {
		const byWord = findWordUtf16Span(messageContent, w);
		if (byWord) return byWord;
	}
	return null;
}

export function resolveTranscriptHighlight(
	problem: ReviewProblem,
	messageId: string,
	messageContent: string,
): { start: number; end: number } | null {
	const span = problem.transcriptSpan;
	if (span?.messageId === messageId && span.end > span.start) {
		return { start: span.start, end: span.end };
	}
	if (problem.messageId !== messageId) return null;

	if (problem.type === "pronunciation") {
		const w = problem.pronunciationTargets?.[0]?.text?.trim();
		if (w) {
			const byWord = findWordUtf16Span(messageContent, w);
			if (byWord) return byWord;
		}
		return null;
	}

	return findUtf16SpanInText(messageContent, problem.sourceText);
}

/**
 * Build highlights for one transcript line. Only includes problems anchored to a
 * **user** message so assistant turns never get review marks.
 */
export function highlightsForUserMessage(
	problems: ReviewProblem[],
	messageId: string,
	content: string,
	userMessageIds: Set<string>,
): TranscriptHighlight[] {
	const out: TranscriptHighlight[] = [];
	for (const p of problems) {
		if (
			p.type !== "grammar" &&
			p.type !== "vocabulary" &&
			p.type !== "pronunciation"
		) {
			continue;
		}

		if (
			p.type === "pronunciation" &&
			(p.pronunciationTargets?.length ?? 0) > 1
		) {
			for (const t of p.pronunciationTargets ?? []) {
				const anchorId =
					t.transcriptSpan?.messageId ??
					t.messageId ??
					p.transcriptSpan?.messageId ??
					p.messageId;
				if (!anchorId || !userMessageIds.has(anchorId)) continue;
				const range = resolvePronunciationTargetInMessage(
					t,
					p,
					messageId,
					content,
				);
				if (!range) continue;
				out.push({
					start: range.start,
					end: range.end,
					kind: "pronunciation",
					problemId: p.id,
				});
			}
			continue;
		}

		const anchorId = p.transcriptSpan?.messageId ?? p.messageId;
		if (!anchorId || !userMessageIds.has(anchorId)) {
			continue;
		}

		const range = resolveTranscriptHighlight(p, messageId, content);
		if (!range) continue;
		out.push({
			start: range.start,
			end: range.end,
			kind: p.type,
			problemId: p.id,
		});
	}
	out.sort((a, b) => a.start - b.start || a.end - b.end);
	return out;
}

export function messageIdForProblemFocus(
	problem: ReviewProblem,
): string | undefined {
	return problem.transcriptSpan?.messageId ?? problem.messageId;
}

type TaskPayloadWithPhonemes = {
	payload?: { phonemeGroups?: Array<{ words?: unknown[] }> };
};

/** Legacy: old feedback bundled many words without structured phoneme drill rows. */
export function isLegacyPronunciationBundle(
	problem: ReviewProblem,
	task?: TaskPayloadWithPhonemes | null,
): boolean {
	if (problem.type !== "pronunciation") return false;
	const groups = task?.payload?.phonemeGroups;
	const hasPhonemeDrill =
		Array.isArray(groups) &&
		groups.some((g) => Array.isArray(g.words) && g.words.length > 0);
	if (hasPhonemeDrill) return false;
	return (problem.pronunciationTargets?.length ?? 0) > 1;
}
