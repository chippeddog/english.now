import { AlertTriangle, ArrowRight, BookOpen, ChevronDown } from "lucide-react";
import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
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
	const objectives = Array.isArray(content.objectives)
		? content.objectives
		: [];
	const rules = Array.isArray(content.rules) ? content.rules : [];
	const vocabulary = Array.isArray(content.vocabulary)
		? content.vocabulary
		: [];

	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			<div className="mb-2">
				<span className="inline-block rounded-full bg-violet-100 px-3 py-1 font-medium text-violet-700 text-xs">
					{badgeLabel}
				</span>
			</div>

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
					This grammar topic does not have detailed rule blocks yet.
				</div>
			)}

			{vocabulary.length > 0 && (
				<div className="mt-8">
					<h3 className="mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
						Key Vocabulary
					</h3>
					<div className="flex flex-wrap gap-2">
						{vocabulary.map((v) => (
							<span
								key={v.word}
								className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-medium text-sky-700 text-sm"
							>
								{v.word}
								{v.definition && (
									<span className="ml-1 font-normal text-sky-500">
										— {v.definition}
									</span>
								)}
							</span>
						))}
					</div>
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
	const [mistakesOpen, setMistakesOpen] = useState(false);

	return (
		<div className="overflow-hidden rounded-2xl border border-border/50 bg-white">
			<div className="border-violet-200 border-b bg-violet-50/50 px-5 py-4">
				<div className="flex items-center gap-2">
					<BookOpen className="size-4 text-violet-600" />
					<h3 className="font-bold text-lg">{rule.title}</h3>
				</div>
			</div>

			<div className="px-5 py-4">
				<p className="mb-4 text-neutral-700 leading-relaxed">
					{rule.explanation}
				</p>

				{rule.formula && (
					<div className="mb-4 rounded-xl bg-neutral-50 px-4 py-3">
						<p className="font-mono text-sm tracking-wide">{rule.formula}</p>
					</div>
				)}

				<div className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
					Examples
				</div>
				<div className="flex flex-col gap-2">
					{rule.examples.map((ex) => (
						<div
							key={ex.sentence}
							className="flex items-start gap-3 rounded-xl bg-neutral-50 px-4 py-3"
						>
							<div className="min-w-0 flex-1">
								<p
									className="text-sm"
									// biome-ignore lint/security/noDangerouslySetInnerHtml: highlighting grammar in examples
									dangerouslySetInnerHTML={{
										__html: ex.sentence.replace(
											new RegExp(
												`(${ex.highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
												"gi",
											),
											'<strong class="text-violet-700">$1</strong>',
										),
									}}
								/>
								{ex.note && (
									<p className="mt-1 text-muted-foreground text-xs italic">
										{ex.note}
									</p>
								)}
							</div>
						</div>
					))}
				</div>

				{rule.commonMistakes && rule.commonMistakes.length > 0 && (
					<div className="mt-4">
						<button
							type="button"
							onClick={() => setMistakesOpen(!mistakesOpen)}
							className="flex w-full items-center gap-2 text-left"
						>
							<AlertTriangle className="size-4 text-amber-500" />
							<span className="font-semibold text-amber-700 text-sm">
								Common Mistakes
							</span>
							<ChevronDown
								className={cn(
									"ml-auto size-4 text-muted-foreground transition-transform",
									mistakesOpen && "rotate-180",
								)}
							/>
						</button>

						{mistakesOpen && (
							<div className="mt-3 flex flex-col gap-2">
								{rule.commonMistakes.map((m) => (
									<div
										key={m.wrong}
										className="rounded-xl border border-amber-200 bg-amber-50 p-3"
									>
										<div className="flex items-start gap-3">
											<div className="min-w-0 flex-1">
												<p className="text-sm">
													<span className="font-medium text-red-600 line-through">
														{m.wrong}
													</span>
													<span className="mx-2 text-muted-foreground">→</span>
													<span className="font-medium text-lime-700">
														{m.correct}
													</span>
												</p>
												<p className="mt-1 text-amber-700 text-xs">{m.why}</p>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
