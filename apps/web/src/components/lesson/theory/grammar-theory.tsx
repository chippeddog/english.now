import { useTranslation } from "@english.now/i18n";
import { ArrowRight, BookOpen } from "lucide-react";
import type { ReactNode } from "react";
import EmojiChip from "@/components/grammar/emoji-chip";
import ExampleBubble from "@/components/grammar/example-bubble";
import type { GrammarLessonContent } from "@/types/lesson";

interface GrammarTheoryProps {
	content: GrammarLessonContent;
	onContinue: () => void;
	continueLabel?: string;
	continueDisabled?: boolean;
	title?: string;
	description?: string;
	badgeLabel?: string;
	headerSlot?: ReactNode;
	footerSlot?: ReactNode;
}

export default function GrammarTheory({
	content,
	onContinue,
	continueLabel = "Start Practice",
	continueDisabled = false,
	title,
	description,
	badgeLabel = "Grammar",
	headerSlot,
	footerSlot,
}: GrammarTheoryProps) {
	const { t } = useTranslation("app");
	const objectives = Array.isArray(content.objectives)
		? content.objectives
		: [];
	const rules = Array.isArray(content.rules) ? content.rules : [];
	const vocabulary = Array.isArray(content.vocabulary)
		? content.vocabulary
		: [];

	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			{headerSlot}

			<h2 className="mb-2 font-bold font-lyon text-2xl">
				{title ?? objectives[0] ?? "Grammar Rules"}
			</h2>
			<p className="mb-8 text-muted-foreground">
				{description ?? content.description}
			</p>

			{rules.length > 0 ? (
				<div className="flex flex-col gap-6">
					{rules.map((rule) => (
						<RuleCard key={rule.title} rule={rule} />
					))}
				</div>
			) : (
				<div className="rounded-2xl border border-border/60 border-dashed bg-white px-5 py-6 text-muted-foreground text-sm">
					{t("grammar.noItems")}
				</div>
			)}

			{footerSlot}

			<div className="mt-10 flex justify-end">
				<button
					type="button"
					onClick={onContinue}
					disabled={continueDisabled}
					className="flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-8 font-semibold text-base text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{continueLabel}
					<ArrowRight className="size-4" />
				</button>
			</div>
		</div>
	);
}

function RuleCard({ rule }: { rule: GrammarLessonContent["rules"][number] }) {
	const { t } = useTranslation("app");
	const keyExamples = rule.examples.slice(0, 2);
	const primaryMistake = rule.commonMistakes?.[0];
	const plainRule = rule.ruleShort ?? rule.explanation;

	return (
		<div className="overflow-hidden rounded-3xl border border-border/50 bg-white shadow-sm">
			<div className="border-violet-200/70 border-b bg-violet-50/60 px-5 py-4">
				<div className="flex flex-wrap items-center gap-2">
					<EmojiChip emoji="1" label="Examples first" className="bg-white" />
					<div className="flex items-center gap-2">
						<BookOpen className="size-4 text-violet-600" />
						<h3 className="font-bold text-lg">{rule.title}</h3>
					</div>
				</div>
			</div>

			<div className="space-y-5 px-5 py-5">
				<div>
					<p className="mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
						Examples
					</p>
					<div className="grid gap-3 md:grid-cols-2">
						{keyExamples.map((example) => (
							<ExampleBubble
								key={example.sentence}
								sentence={example.sentence}
								highlight={example.highlight}
								note={example.note}
							/>
						))}
					</div>
				</div>

				<div className="rounded-2xl bg-neutral-50 px-4 py-4">
					<p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
						Rule
					</p>
					<p className="text-neutral-800 leading-relaxed">{plainRule}</p>
					{rule.formula ? (
						<p className="mt-3 font-mono text-muted-foreground text-sm">
							{rule.formula}
						</p>
					) : null}
				</div>

				{primaryMistake ? (
					<div>
						<p className="mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
							{t("grammar.contrast.wrong")} / {t("grammar.contrast.right")}
						</p>
						<div className="grid gap-3 md:grid-cols-2">
							<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
								<p className="mb-2 font-semibold text-red-700 text-xs uppercase tracking-wider">
									{t("grammar.contrast.wrong")}
								</p>
								<p className="font-medium text-red-700 line-through">
									{primaryMistake.wrong}
								</p>
							</div>
							<div className="rounded-2xl border border-lime-200 bg-lime-50 px-4 py-4">
								<p className="mb-2 font-semibold text-lime-700 text-xs uppercase tracking-wider">
									{t("grammar.contrast.right")}
								</p>
								<p className="font-medium text-lime-700">
									{primaryMistake.correct}
								</p>
								<p className="mt-2 text-lime-900 text-sm">
									{primaryMistake.why}
								</p>
							</div>
						</div>
					</div>
				) : null}

				{rule.signal ? (
					<div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4">
						<p className="mb-2 font-semibold text-sky-700 text-xs uppercase tracking-wider">
							{t("grammar.signal")}
						</p>
						<p className="text-sky-950 text-sm leading-relaxed">
							{rule.signal}
						</p>
					</div>
				) : null}
			</div>
		</div>
	);
}
