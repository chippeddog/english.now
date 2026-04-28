import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, BookOpenIcon, Check, ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";
import {
	ExplanationRenderer,
	QuickMapRenderer,
	type StructuredExplanation,
	type StructuredQuickMap,
} from "./grammar-topic-content-renderers";

type GrammarRule = {
	title: string;
	explanation: string;
	formula?: string;
	ruleShort?: string;
	signal?: string;
	examples: { sentence: string; highlight: string; note?: string }[];
	commonMistakes?: { wrong: string; correct: string; why: string }[];
};

type TopicContentWithStructured = {
	rules?: GrammarRule[];
	vocabulary?: unknown[];
	notes?: string[];
	explanation?: StructuredExplanation;
	quickMap?: StructuredQuickMap;
};

type LegacyQuickMap =
	| {
			type: "forms";
			title: string;
			description: string;
			rows: { label: string; value: string }[];
	  }
	| {
			type: "decision";
			title: string;
			description: string;
			steps: { label: string; value: string }[];
	  }
	| {
			type: "formula";
			title: string;
			description: string;
			formulas: { label: string; value: string; example?: string }[];
	  };

const POSSESSIVE_ADJECTIVES = [
	{ label: "I", value: "my" },
	{ label: "you", value: "your" },
	{ label: "he", value: "his" },
	{ label: "she", value: "her" },
	{ label: "it", value: "its" },
	{ label: "we", value: "our" },
	{ label: "they", value: "their" },
];

function buildQuickMap({
	title,
	category,
	rules,
}: {
	title: string;
	category: string;
	rules: GrammarRule[];
}): LegacyQuickMap | null {
	const searchable = `${title} ${category}`.toLowerCase();

	if (
		searchable.includes("possessive adjective") ||
		searchable.includes("possessive adjectives")
	) {
		return {
			type: "forms",
			title: "Possessive adjective forms",
			description: "Match the owner to the adjective before the noun.",
			rows: POSSESSIVE_ADJECTIVES,
		};
	}

	if (searchable.includes("article") || /\ba\/an\b/.test(searchable)) {
		return {
			type: "decision",
			title: "Article decision tree",
			description: "Pick the article by asking these questions in order.",
			steps: [
				{ label: "Specific?", value: "Use the" },
				{ label: "One of many?", value: "Use a or an" },
				{ label: "Next sound is vowel?", value: "Use an" },
				{ label: "Next sound is consonant?", value: "Use a" },
				{ label: "General plural/uncountable?", value: "Use no article" },
			],
		};
	}

	const formulas = rules
		.map((rule) => ({
			label: rule.title,
			value: rule.formula ?? rule.ruleShort ?? "",
			example: rule.examples[0]?.sentence,
		}))
		.filter((item) => item.value.length > 0)
		.slice(0, 5);

	if (formulas.length > 0) {
		return {
			type: "formula",
			title: "Pattern at a glance",
			description: "Use this as a quick reference during drills.",
			formulas,
		};
	}

	const examplePatterns = rules
		.flatMap((rule) =>
			rule.examples.slice(0, 1).map((example) => ({
				label: rule.title,
				value: example.highlight,
				example: example.sentence,
			})),
		)
		.filter((item) => item.value.length > 0)
		.slice(0, 5);

	if (examplePatterns.length > 0) {
		return {
			type: "formula",
			title: "Pattern at a glance",
			description: "The highlighted forms are the ones to copy.",
			formulas: examplePatterns,
		};
	}

	return null;
}

export function GrammarTopicDetailView({
	slug,
	onBack,
	onClose,
}: {
	slug: string;
	onBack: () => void;
	onClose: () => void;
}) {
	const { t } = useTranslation("app");
	const trpc = useTRPC();
	const navigate = useNavigate();

	const { data: topic, isLoading } = useQuery(
		trpc.grammar.getTopic.queryOptions({ topicId: slug }),
	);

	const startDrill = useMutation(
		trpc.grammar.startDrillSession.mutationOptions({
			onSuccess: ({ sessionId }) => {
				onClose();
				navigate({
					to: "/grammar/$sessionId",
					params: { sessionId },
				});
			},
			onError: (err) => {
				toast.error(
					err.message === "NO_DRILL_ITEMS_AVAILABLE"
						? "No drill questions are available for this topic yet."
						: err.message === "FREE_WEEKLY_PRACTICE_LIMIT_REACHED" ||
								err.message === "FREE_DAILY_GRAMMAR_LIMIT_REACHED"
							? "You reached this week's free practice limit."
							: err.message === "GENERATION_FAILED"
								? "We couldn't generate a fresh drill right now. Please try again."
								: "Failed to start drill. Try again.",
				);
			},
		}),
	);

	const status = topic?.status ?? "not_started";
	const drillItemCount = topic?.drillItemCount ?? 0;
	const hasDrills = drillItemCount > 0;
	const activeSessionId = topic?.activeSessionId ?? null;
	const primaryLabel = activeSessionId
		? t("practice.continue")
		: status === "completed"
			? t("grammar.review.practiceAgain")
			: t("grammar.startPractice");

	const content = topic?.content as TopicContentWithStructured | undefined;
	const objectives = topic?.objectives ?? [];
	const rules = content?.rules ?? [];
	const vocabulary = content?.vocabulary ?? [];
	const notes = content?.notes ?? [];
	const structuredExplanation = content?.explanation;
	const structuredQuickMap = content?.quickMap;
	const legacyQuickMap = topic
		? buildQuickMap({
				title: topic.title,
				category: topic.category,
				rules,
			})
		: null;
	const hasPreviewContent =
		Boolean(structuredExplanation) ||
		Boolean(structuredQuickMap) ||
		rules.length > 0 ||
		vocabulary.length > 0;

	const handleStart = () => {
		if (!topic || startDrill.isPending) return;
		if (activeSessionId) {
			onClose();
			navigate({
				to: "/grammar/$sessionId",
				params: { sessionId: activeSessionId },
			});
			return;
		}
		if (!hasDrills) return;
		startDrill.mutate({ topicId: topic.id });
	};

	return (
		<>
			<div className="flex items-center border-border/60 border-b px-4 py-3">
				<button
					type="button"
					onClick={onBack}
					className="inline-flex cursor-pointer items-center gap-1 py-1.5 font-medium text-muted-foreground text-sm transition-colors"
				>
					<ChevronLeft className="size-4" />
					Back
				</button>
			</div>

			<div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[minmax(0,1.15fr)_420px]">
				<div className="flex flex-col gap-4 p-6">
					<DialogTitle
						className={cn(
							"font-lyon font-semibold text-3xl leading-tight",
							(!topic || isLoading) && "sr-only",
						)}
					>
						{topic?.title ?? "Grammar topic"}
					</DialogTitle>
					{isLoading || !topic ? (
						<>
							<Skeleton className="h-8 w-3/4 rounded-md" />
							<Skeleton className="h-4 w-full rounded-md" />
							<Skeleton className="h-4 w-4/5 rounded-md" />
							<Skeleton className="mt-2 h-20 w-full rounded-md" />
						</>
					) : (
						<>
							{topic.description || topic.summary ? (
								<p className="text-muted-foreground">
									{topic.description || topic.summary}
								</p>
							) : null}

							{objectives.length > 0 ? (
								<div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-neutral-50/70 p-4">
									<p className="font-medium text-slate-900 text-sm">
										What you will learn?
									</p>
									<ul className="flex flex-col gap-2.5">
										{objectives.map((objective) => (
											<li
												key={objective}
												className="flex items-start gap-2.5 text-slate-700 text-sm"
											>
												<Check
													className="mt-0.5 size-4 shrink-0 text-slate-900"
													strokeWidth={2.5}
												/>
												<span>{objective}</span>
											</li>
										))}
									</ul>
								</div>
							) : null}

							{structuredExplanation ? (
								<ExplanationRenderer explanation={structuredExplanation} />
							) : rules.length > 0 ? (
								<LegacyExplanationRenderer rules={rules} />
							) : null}

							{notes.length > 0 ? (
								<div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
									<p className="mb-2 font-semibold text-amber-950 text-sm">
										Remember
									</p>
									<ul className="flex flex-col gap-2">
										{notes.map((note) => (
											<li
												key={note}
												className="flex gap-2 text-amber-950/80 text-sm"
											>
												<span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-500" />
												<span>{note}</span>
											</li>
										))}
									</ul>
								</div>
							) : null}
						</>
					)}
				</div>

				<div className="flex min-h-0 flex-col gap-4 border-border/60 border-t bg-neutral-50/60 p-4 md:border-t-0 md:border-l">
					{isLoading ? (
						<>
							<Skeleton className="h-14 w-full rounded-xl" />
							<Skeleton className="h-14 w-full rounded-xl" />
							<Skeleton className="h-14 w-full rounded-xl" />
						</>
					) : !hasPreviewContent ? (
						<div className="flex h-full flex-col items-center justify-center rounded-xl border border-border/60 border-dashed bg-white p-6 text-center">
							<BookOpenIcon className="mb-2 size-5 text-muted-foreground" />
							<p className="text-muted-foreground text-sm">
								Preview coming soon for this topic.
							</p>
						</div>
					) : (
						<div>
							{structuredQuickMap ? (
								<QuickMapRenderer map={structuredQuickMap} />
							) : legacyQuickMap ? (
								<QuickMapCard map={legacyQuickMap} />
							) : (
								<div className="rounded-2xl border border-border/60 border-dashed bg-white p-4 text-muted-foreground text-sm">
									Quick reference coming soon for this topic.
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			<div className="flex items-center justify-between gap-2 border-border/60 border-t px-4 py-3">
				<div className="flex flex-col gap-2">
					{topic && !isLoading ? (
						<div className="flex items-center gap-2">
							<Badge variant={topic.level}>{topic.level}</Badge>

							{topic.estimatedMinutes ? (
								<span className="inline-flex items-center gap-1 text-muted-foreground text-sm">
									{topic.estimatedMinutes} min
								</span>
							) : null}
						</div>
					) : null}
				</div>
				{/* <Button
					type="button"
					variant="ghost"
					onClick={handlePreview}
					disabled={isLoading || !topic}
					className="gap-1.5"
				>
					<Eye className="size-4" />
					Preview
				</Button> */}
				{/* <button
					type="button"
					onClick={handleStart}
					disabled={!topic || !hasDrills || startDrill.isPending}
					className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 font-semibold text-base text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{startDrill.isPending ? "Starting..." : primaryLabel}
					<ArrowRight className="size-4" />
				</button> */}
				<Button
					type="button"
					size="lg"
					onClick={handleStart}
					disabled={!topic || !hasDrills || startDrill.isPending}
					className="rounded-xl bg-blue-600 text-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{startDrill.isPending ? "Starting..." : primaryLabel}
					<ArrowRight className="size-4" />
				</Button>
			</div>
		</>
	);
}

function LegacyExplanationRenderer({ rules }: { rules: GrammarRule[] }) {
	return (
		<div className="flex flex-col gap-4">
			<div>
				<p className="font-semibold text-slate-900">Explanation</p>
				<p className="text-muted-foreground text-sm">
					Read the rule, then use the quick map while practicing.
				</p>
			</div>
			{rules.map((rule, index) => (
				<ExplanationCard
					key={`${rule.title}-${index}`}
					rule={rule}
					index={index}
				/>
			))}
		</div>
	);
}

function ExplanationCard({
	rule,
	index,
}: {
	rule: GrammarRule;
	index: number;
}) {
	const examples = rule.examples.slice(0, 2);
	const primaryMistake = rule.commonMistakes?.[0];

	return (
		<section className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
			<div className="mb-3 flex items-start gap-3">
				<div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-neutral-100 font-semibold text-neutral-700 text-sm">
					{index + 1}
				</div>
				<div className="min-w-0">
					<h3 className="font-semibold text-slate-900">{rule.title}</h3>
					<p className="mt-1 text-slate-700 text-sm leading-relaxed">
						{rule.explanation}
					</p>
				</div>
			</div>

			{rule.formula ? (
				<div className="mb-3 rounded-xl bg-neutral-950 px-3 py-2 font-mono text-neutral-50 text-sm">
					{rule.formula}
				</div>
			) : null}

			{examples.length > 0 ? (
				<div className="grid gap-2 sm:grid-cols-2">
					{examples.map((example) => (
						<div
							key={example.sentence}
							className="rounded-xl border border-border/60 bg-neutral-50/70 p-3"
						>
							<p className="text-slate-800 text-sm">
								{highlightExample(example.sentence, example.highlight)}
							</p>
							{example.note ? (
								<p className="mt-1 text-muted-foreground text-xs">
									{example.note}
								</p>
							) : null}
						</div>
					))}
				</div>
			) : null}

			{rule.signal ? (
				<p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sky-950 text-sm">
					<span className="font-semibold">Signal: </span>
					{rule.signal}
				</p>
			) : null}

			{primaryMistake ? (
				<div className="mt-3 grid gap-2 sm:grid-cols-2">
					<div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2">
						<p className="font-semibold text-red-700 text-xs uppercase">
							Wrong
						</p>
						<p className="text-red-700 text-sm line-through">
							{primaryMistake.wrong}
						</p>
					</div>
					<div className="rounded-xl border border-lime-200 bg-lime-50 px-3 py-2">
						<p className="font-semibold text-lime-700 text-xs uppercase">
							Right
						</p>
						<p className="text-lime-800 text-sm">{primaryMistake.correct}</p>
					</div>
				</div>
			) : null}
		</section>
	);
}

function QuickMapCard({ map }: { map: LegacyQuickMap }) {
	return (
		<div className="overflow-hidden rounded-2xl border border-border/60 bg-white">
			<div className="flex items-center gap-2 px-3 py-3">
				<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
					<BookOpenIcon className="size-4 text-neutral-600" />
				</div>
				<p className="font-semibold text-slate-900 text-sm">{map.title}</p>
			</div>

			{map.type === "forms" ? (
				<div className="grid grid-cols-2 divide-x divide-y divide-border/60">
					{map.rows.map((row) => (
						<div
							key={row.label}
							className="flex items-center justify-between p-3"
						>
							<span className="text-muted-foreground text-sm">{row.label}</span>
							<span className="font-semibold text-slate-900">{row.value}</span>
						</div>
					))}
				</div>
			) : null}

			{map.type === "decision" ? (
				<div className="p-4">
					<div className="flex flex-col gap-2">
						{map.steps.map((step, index) => (
							<div key={step.label} className="flex gap-3">
								<div className="flex flex-col items-center">
									<div className="flex size-7 items-center justify-center rounded-full bg-neutral-900 font-semibold text-white text-xs">
										{index + 1}
									</div>
									{index < map.steps.length - 1 ? (
										<div className="h-5 w-px bg-border" />
									) : null}
								</div>
								<div className="min-w-0 pb-2">
									<p className="font-medium text-slate-900 text-sm">
										{step.label}
									</p>
									<p className="text-muted-foreground text-sm">{step.value}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			) : null}

			{map.type === "formula" ? (
				<div className="flex flex-col gap-3 p-4">
					{map.formulas.map((formula) => (
						<div key={formula.label} className="rounded-xl bg-neutral-50 p-3">
							<p className="mb-2 font-medium text-slate-900 text-sm">
								{formula.label}
							</p>
							<p className="rounded-lg bg-white px-3 py-2 font-mono text-slate-900 text-sm">
								{formula.value}
							</p>
							{formula.example ? (
								<p className="mt-2 text-muted-foreground text-xs">
									{formula.example}
								</p>
							) : null}
						</div>
					))}
				</div>
			) : null}
		</div>
	);
}

function highlightExample(sentence: string, highlight: string) {
	if (!highlight || !sentence.includes(highlight)) {
		return sentence;
	}

	const start = sentence.indexOf(highlight);
	const before = sentence.slice(0, start);
	const after = sentence.slice(start + highlight.length);

	return (
		<>
			{before}
			<mark className="rounded bg-yellow-200/80 px-1 font-medium text-slate-950">
				{highlight}
			</mark>
			{after}
		</>
	);
}
