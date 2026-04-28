import {
	BookOpenIcon,
	Clock3Icon,
	GitBranchIcon,
	Layers3Icon,
	ScaleIcon,
	Table2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type BlockColor = "success" | "error" | "ai";

type PatternPart = {
	text: string;
	role: "subject" | "verb" | "auxiliary" | "object" | "rest" | "modifier";
	highlight?: boolean;
};

type Pattern = {
	slots: string[];
	example: {
		parts: PatternPart[];
	};
};

type MistakeItem = {
	wrong: string;
	right: string;
	why: string;
};

type PairSide = {
	label: string;
	sentence: string;
	highlight: string;
	hint: string;
};

export type ExplanationSection =
	| {
			kind: "rule";
			text: string;
	  }
	| {
			kind: "form";
			title: string;
			color: BlockColor;
			pattern: Pattern;
			examples: string[];
			note?: string;
	  }
	| {
			kind: "contrast";
			title?: string;
			items: MistakeItem[];
	  }
	| {
			kind: "signal";
			title?: string;
			rule: string;
			cues: string[];
	  }
	| {
			kind: "table";
			title?: string;
			columns: [string, string];
			rows: [string, string][];
			note?: string;
	  }
	| {
			kind: "pair";
			title?: string;
			left: PairSide;
			right: PairSide;
	  };

export type StructuredExplanation = {
	intro: string;
	sections: ExplanationSection[];
};

type DecisionTreeNode =
	| {
			question: string;
			yes: DecisionTreeNode;
			no: DecisionTreeNode;
	  }
	| {
			answer: string;
			example: string;
	  };

export type StructuredQuickMap =
	| {
			type: "forms_table";
			title: string;
			icon?: string;
			columns: [string, string];
			rows: { from: string; to: string }[];
	  }
	| {
			type: "tense_card";
			title: string;
			icon?: string;
			blocks: {
				label: string;
				color: BlockColor;
				formula: string;
				example: string;
			}[];
			signals?: string[];
	  }
	| {
			type: "formula";
			title: string;
			icon?: string;
			slots: string[];
			example: string;
	  }
	| {
			type: "decision_tree";
			title: string;
			icon?: string;
			root: DecisionTreeNode;
	  }
	| {
			type: "timeline";
			title: string;
			icon?: string;
			anchor: "now";
			events: {
				label: string;
				position: "past" | "past-to-now" | "now" | "now-to-future" | "future";
				marker: "point" | "span";
			}[];
			caption: string;
	  }
	| {
			type: "minimal_pair";
			title: string;
			icon?: string;
			left: PairSide;
			right: PairSide;
	  }
	| {
			type: "register_ladder";
			title: string;
			icon?: string;
			tiers: {
				level: "formal" | "neutral" | "casual";
				example: string;
			}[];
	  }
	| {
			type: "clock";
			title: string;
			icon?: string;
			variant: "day" | "week" | "year";
			slots: {
				preposition: string;
				examples: string[];
			}[];
	  };

const colorClasses: Record<
	BlockColor,
	{
		border: string;
		bg: string;
		text: string;
		badge: string;
	}
> = {
	success: {
		border: "border-lime-200",
		bg: "bg-lime-50",
		text: "text-lime-900",
		badge: "bg-lime-100 text-lime-800",
	},
	error: {
		border: "border-red-200",
		bg: "bg-red-50",
		text: "text-red-900",
		badge: "bg-red-100 text-red-800",
	},
	ai: {
		border: "border-blue-200",
		bg: "bg-blue-50",
		text: "text-blue-900",
		badge: "bg-blue-100 text-blue-800",
	},
};

export function ExplanationRenderer({
	explanation,
}: {
	explanation: StructuredExplanation;
}) {
	return (
		<div className="flex flex-col gap-4">
			<div>
				<p className="font-semibold text-slate-900">Explanation</p>
				<p className="text-muted-foreground text-sm leading-relaxed">
					{explanation.intro}
				</p>
			</div>
			{explanation.sections.map((section, index) => (
				<ExplanationSectionCard
					key={`${section.kind}-${index}`}
					section={section}
					index={index}
				/>
			))}
		</div>
	);
}

export function QuickMapRenderer({ map }: { map: StructuredQuickMap }) {
	return (
		<div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
			<div className="flex items-center gap-2 border-border/60 border-b px-3 py-3">
				<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-base">
					{map.icon ?? <QuickMapIcon type={map.type} />}
				</div>
				<p className="font-semibold text-slate-900 text-sm">{map.title}</p>
			</div>
			<QuickMapBody map={map} />
		</div>
	);
}

function ExplanationSectionCard({
	section,
	index,
}: {
	section: ExplanationSection;
	index: number;
}) {
	if (section.kind === "rule") {
		return (
			<section className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
				<SectionHeading index={index} title="Core rule" />
				<p className="mt-3 text-slate-700 text-sm leading-relaxed">
					{section.text}
				</p>
			</section>
		);
	}

	if (section.kind === "form") {
		return <FormSection section={section} index={index} />;
	}

	if (section.kind === "contrast") {
		return <ContrastSection section={section} index={index} />;
	}

	if (section.kind === "signal") {
		return <SignalSection section={section} index={index} />;
	}

	if (section.kind === "table") {
		return <TableSection section={section} index={index} />;
	}

	return <PairSection section={section} index={index} />;
}

function SectionHeading({ index, title }: { index: number; title: string }) {
	return (
		<div className="flex items-center gap-3">
			<div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-neutral-100 font-semibold text-neutral-700 text-sm">
				{index + 1}
			</div>
			<h3 className="font-semibold text-slate-900">{title}</h3>
		</div>
	);
}

function FormSection({
	section,
	index,
}: {
	section: Extract<ExplanationSection, { kind: "form" }>;
	index: number;
}) {
	const colors = colorClasses[section.color];

	return (
		<section
			className={cn(
				"rounded-2xl border bg-white p-4 shadow-sm",
				colors.border,
			)}
		>
			<SectionHeading index={index} title={section.title} />
			<div className="mt-3 flex flex-wrap gap-2">
				{section.pattern.slots.map((slot, slotIndex) => (
					<div key={slot} className="flex items-center gap-2">
						<span
							className={cn(
								"rounded-full px-3 py-1 font-medium text-xs",
								colors.badge,
							)}
						>
							{slot}
						</span>
						{slotIndex < section.pattern.slots.length - 1 ? (
							<span className="text-muted-foreground text-xs">+</span>
						) : null}
					</div>
				))}
			</div>
			<div className={cn("mt-3 rounded-xl border p-3", colors.border, colors.bg)}>
				<p className="text-sm leading-relaxed">
					{section.pattern.example.parts.map((part, partIndex) => (
						<span
							key={`${part.text}-${partIndex}`}
							className={cn(
								part.highlight &&
									"rounded bg-white px-1 font-semibold shadow-sm",
								part.highlight && colors.text,
							)}
						>
							{part.text}
							{partIndex < section.pattern.example.parts.length - 1 ? " " : ""}
						</span>
					))}
				</p>
			</div>
			<div className="mt-3 grid gap-2 sm:grid-cols-2">
				{section.examples.slice(0, 4).map((example) => (
					<p
						key={example}
						className="rounded-xl border border-border/60 bg-neutral-50/70 p-3 text-slate-700 text-sm"
					>
						{example}
					</p>
				))}
			</div>
			{section.note ? (
				<p className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-muted-foreground text-sm">
					{section.note}
				</p>
			) : null}
		</section>
	);
}

function ContrastSection({
	section,
	index,
}: {
	section: Extract<ExplanationSection, { kind: "contrast" }>;
	index: number;
}) {
	return (
		<section className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
			<SectionHeading index={index} title={section.title ?? "Watch out"} />
			<div className="mt-3 flex flex-col gap-3">
				{section.items.map((item) => (
					<div
						key={`${item.wrong}-${item.right}`}
						className="rounded-xl border border-border/60 bg-neutral-50/70 p-3"
					>
						<div className="grid gap-2 sm:grid-cols-2">
							<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
								<p className="font-semibold text-red-700 text-xs uppercase">
									Wrong
								</p>
								<p className="text-red-700 text-sm line-through">
									{item.wrong}
								</p>
							</div>
							<div className="rounded-lg border border-lime-200 bg-lime-50 px-3 py-2">
								<p className="font-semibold text-lime-700 text-xs uppercase">
									Right
								</p>
								<p className="text-lime-800 text-sm">{item.right}</p>
							</div>
						</div>
						<p className="mt-2 text-muted-foreground text-sm">{item.why}</p>
					</div>
				))}
			</div>
		</section>
	);
}

function SignalSection({
	section,
	index,
}: {
	section: Extract<ExplanationSection, { kind: "signal" }>;
	index: number;
}) {
	return (
		<section className="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
			<SectionHeading index={index} title={section.title ?? "When to use it"} />
			<p className="mt-3 text-slate-700 text-sm leading-relaxed">
				{section.rule}
			</p>
			<div className="mt-3 flex flex-wrap gap-2">
				{section.cues.map((cue) => (
					<span
						key={cue}
						className="rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-800 text-xs"
					>
						{cue}
					</span>
				))}
			</div>
		</section>
	);
}

function TableSection({
	section,
	index,
}: {
	section: Extract<ExplanationSection, { kind: "table" }>;
	index: number;
}) {
	return (
		<section className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
			<SectionHeading index={index} title={section.title ?? "Forms"} />
			<div className="mt-3 overflow-hidden rounded-xl border border-border/60">
				<div className="grid grid-cols-2 bg-neutral-50 font-medium text-slate-700 text-sm">
					{section.columns.map((column) => (
						<div key={column} className="px-3 py-2">
							{column}
						</div>
					))}
				</div>
				{section.rows.map(([left, right]) => (
					<div
						key={`${left}-${right}`}
						className="grid grid-cols-2 border-border/60 border-t text-sm"
					>
						<div className="px-3 py-2 text-muted-foreground">{left}</div>
						<div className="px-3 py-2 font-semibold text-slate-900">{right}</div>
					</div>
				))}
			</div>
			{section.note ? (
				<p className="mt-3 text-muted-foreground text-sm">{section.note}</p>
			) : null}
		</section>
	);
}

function PairSection({
	section,
	index,
}: {
	section: Extract<ExplanationSection, { kind: "pair" }>;
	index: number;
}) {
	return (
		<section className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
			<SectionHeading index={index} title={section.title ?? "Compare"} />
			<div className="mt-3 grid gap-3 sm:grid-cols-2">
				<PairSideCard side={section.left} />
				<PairSideCard side={section.right} />
			</div>
		</section>
	);
}

function QuickMapBody({ map }: { map: StructuredQuickMap }) {
	if (map.type === "forms_table") {
		return (
			<div>
				<div className="grid grid-cols-2 bg-neutral-50 px-3 py-2 font-medium text-muted-foreground text-xs uppercase">
					<span>{map.columns[0]}</span>
					<span>{map.columns[1]}</span>
				</div>
				<div className="grid grid-cols-2 divide-x divide-y divide-border/60">
					{map.rows.map((row) => (
						<div
							key={`${row.from}-${row.to}`}
							className="contents *:px-3 *:py-2"
						>
							<span className="text-muted-foreground text-sm">{row.from}</span>
							<span className="font-semibold text-slate-900 text-sm">
								{row.to}
							</span>
						</div>
					))}
				</div>
			</div>
		);
	}

	if (map.type === "tense_card") {
		return (
			<div className="flex flex-col gap-3 p-4">
				{map.blocks.map((block) => {
					const colors = colorClasses[block.color];
					return (
						<div
							key={block.label}
							className={cn("rounded-xl border p-3", colors.border, colors.bg)}
						>
							<p className={cn("font-semibold text-sm", colors.text)}>
								{block.label}
							</p>
							<p className="mt-2 rounded-lg bg-white px-3 py-2 font-mono text-slate-900 text-xs">
								{block.formula}
							</p>
							<p className="mt-2 text-slate-700 text-sm">{block.example}</p>
						</div>
					);
				})}
				{map.signals?.length ? (
					<div className="flex flex-wrap gap-2">
						{map.signals.map((signal) => (
							<span
								key={signal}
								className="rounded-full bg-neutral-100 px-2.5 py-1 text-muted-foreground text-xs"
							>
								{signal}
							</span>
						))}
					</div>
				) : null}
			</div>
		);
	}

	if (map.type === "formula") {
		return (
			<div className="p-4">
				<div className="flex flex-wrap items-center gap-2">
					{map.slots.map((slot, index) => (
						<div key={slot} className="flex items-center gap-2">
							<span className="rounded-full bg-neutral-100 px-3 py-1 font-medium text-slate-800 text-xs">
								{slot}
							</span>
							{index < map.slots.length - 1 ? (
								<span className="text-muted-foreground text-xs">+</span>
							) : null}
						</div>
					))}
				</div>
				<p className="mt-3 rounded-xl bg-neutral-50 p-3 text-slate-700 text-sm">
					{map.example}
				</p>
			</div>
		);
	}

	if (map.type === "decision_tree") {
		return (
			<div className="p-4">
				<DecisionTreeNodeCard node={map.root} />
			</div>
		);
	}

	if (map.type === "timeline") {
		return (
			<div className="p-4">
				<div className="grid grid-cols-5 items-end gap-2">
					{["past", "past-to-now", "now", "now-to-future", "future"].map(
						(position) => {
							const event = map.events.find(
								(item) => item.position === position,
							);
							return (
								<div key={position} className="flex min-h-24 flex-col gap-2">
									<div className="flex flex-1 items-end">
										{event ? (
											<div
												className={cn(
													"w-full rounded-lg border border-blue-200 bg-blue-50 p-2 text-center text-blue-900 text-xs",
													event.marker === "span" && "min-h-14",
												)}
											>
												{event.label}
											</div>
										) : null}
									</div>
									<div
										className={cn(
											"h-1 rounded-full bg-neutral-200",
											position === "now" && "bg-blue-500",
										)}
									/>
								</div>
							);
						},
					)}
				</div>
				<p className="mt-3 text-muted-foreground text-sm">{map.caption}</p>
			</div>
		);
	}

	if (map.type === "minimal_pair") {
		return (
			<div className="grid gap-3 p-4">
				<PairSideCard side={map.left} compact />
				<PairSideCard side={map.right} compact />
			</div>
		);
	}

	if (map.type === "register_ladder") {
		return (
			<div className="flex flex-col gap-2 p-4">
				{map.tiers.map((tier, index) => (
					<div
						key={tier.level}
						className="rounded-xl border border-border/60 bg-neutral-50/70 p-3"
					>
						<p className="font-semibold text-slate-900 text-xs uppercase">
							{index + 1}. {tier.level}
						</p>
						<p className="mt-1 text-slate-700 text-sm">{tier.example}</p>
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3 p-4">
			<p className="text-muted-foreground text-sm">
				Time view: {map.variant}
			</p>
			{map.slots.map((slot) => (
				<div
					key={slot.preposition}
					className="rounded-xl border border-border/60 bg-neutral-50/70 p-3"
				>
					<p className="font-mono font-semibold text-slate-900">
						{slot.preposition}
					</p>
					<div className="mt-2 flex flex-wrap gap-2">
						{slot.examples.map((example) => (
							<span
								key={example}
								className="rounded-full bg-white px-2.5 py-1 text-slate-700 text-xs"
							>
								{example}
							</span>
						))}
					</div>
				</div>
			))}
		</div>
	);
}

function DecisionTreeNodeCard({
	node,
	depth = 0,
}: {
	node: DecisionTreeNode;
	depth?: number;
}) {
	if ("answer" in node) {
		return (
			<div className="rounded-xl border border-lime-200 bg-lime-50 p-3">
				<p className="font-semibold text-lime-900 text-sm">{node.answer}</p>
				<p className="mt-1 text-lime-800 text-xs">{node.example}</p>
			</div>
		);
	}

	return (
		<div className={cn("rounded-xl border border-border/60 bg-neutral-50 p-3")}>
			<p className="font-semibold text-slate-900 text-sm">{node.question}</p>
			<div className="mt-3 grid gap-2">
				<TreeBranch label="Yes" node={node.yes} depth={depth + 1} />
				<TreeBranch label="No" node={node.no} depth={depth + 1} />
			</div>
		</div>
	);
}

function TreeBranch({
	label,
	node,
	depth,
}: {
	label: "Yes" | "No";
	node: DecisionTreeNode;
	depth: number;
}) {
	return (
		<div className="flex gap-2">
			<span className="mt-1 h-fit rounded-full bg-white px-2 py-0.5 font-medium text-muted-foreground text-xs">
				{label}
			</span>
			<div className={cn("min-w-0 flex-1", depth > 2 && "text-xs")}>
				<DecisionTreeNodeCard node={node} depth={depth} />
			</div>
		</div>
	);
}

function PairSideCard({
	side,
	compact = false,
}: {
	side: PairSide;
	compact?: boolean;
}) {
	return (
		<div className="rounded-xl border border-border/60 bg-neutral-50/70 p-3">
			<p className="font-semibold text-slate-900 text-sm">{side.label}</p>
			<p
				className={cn(
					"mt-2 text-slate-700 text-sm leading-relaxed",
					compact && "text-xs",
				)}
			>
				{highlightText(side.sentence, side.highlight)}
			</p>
			<p className="mt-2 text-muted-foreground text-xs">{side.hint}</p>
		</div>
	);
}

function QuickMapIcon({ type }: { type: StructuredQuickMap["type"] }) {
	if (type === "forms_table") return <Table2Icon className="size-4" />;
	if (type === "decision_tree") return <GitBranchIcon className="size-4" />;
	if (type === "timeline" || type === "clock") {
		return <Clock3Icon className="size-4" />;
	}
	if (type === "minimal_pair") return <ScaleIcon className="size-4" />;
	if (type === "register_ladder") return <Layers3Icon className="size-4" />;
	return <BookOpenIcon className="size-4" />;
}

function highlightText(sentence: string, highlight: string) {
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
