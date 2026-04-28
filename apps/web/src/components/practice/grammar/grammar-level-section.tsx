import {
	BookOpenIcon,
	ChevronDown,
	Clock,
	Hash,
	type LucideIcon,
	Sparkles,
	Type,
	User,
	Zap,
} from "lucide-react";
import { useMemo } from "react";
import { GrammarTopicCard } from "@/components/practice/grammar/grammar-topic-card";
import type { TopicListItem } from "@/components/practice/grammar-route-shared";
import { cn } from "@/lib/utils";

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

const LEVEL_TEXT: Record<CefrLevel, string> = {
	A1: "text-emerald-700",
	A2: "text-teal-700",
	B1: "text-sky-700",
	B2: "text-indigo-700",
	C1: "text-purple-700",
	C2: "text-rose-700",
};

const LEVEL_LABELS: Record<CefrLevel, string> = {
	A1: "Beginner",
	A2: "Elementary",
	B1: "Intermediate",
	B2: "Upper-Intermediate",
	C1: "Advanced",
	C2: "Proficiency",
};

const CATEGORY_ICON_RULES: Array<{ match: RegExp; icon: LucideIcon }> = [
	{ match: /verb|phrasal/i, icon: Zap },
	{ match: /tense/i, icon: Clock },
	{ match: /pronoun/i, icon: User },
	{ match: /determiner|quantifier|article/i, icon: Hash },
	{ match: /adjective|adverb/i, icon: Sparkles },
	{ match: /noun|plural|countable/i, icon: Type },
];

function getCategoryIcon(category: string): LucideIcon {
	const rule = CATEGORY_ICON_RULES.find(({ match }) => match.test(category));
	return rule?.icon ?? BookOpenIcon;
}

export function GrammarLevelSection({
	level,
	topics,
	isExpanded,
	onToggle,
	topRecommendedId,
	onOpen,
}: {
	level: CefrLevel;
	topics: TopicListItem[];
	isExpanded: boolean;
	onToggle: () => void;
	topRecommendedId: string | null;
	onOpen: (slug: string) => void;
}) {
	const completedCount = topics.filter(
		(topic) => topic.status === "completed",
	).length;
	const levelText = LEVEL_TEXT[level] ?? "text-neutral-700";

	const categoryGroups = useMemo(() => {
		const groups = new Map<string, TopicListItem[]>();
		for (const topic of topics) {
			const key = topic.category || "Other";
			const existing = groups.get(key);
			if (existing) {
				existing.push(topic);
			} else {
				groups.set(key, [topic]);
			}
		}
		return Array.from(groups.entries());
	}, [topics]);

	return (
		<section className="overflow-hidden rounded-3xl border border-border/60 bg-white">
			<button
				type="button"
				onClick={onToggle}
				className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50"
				aria-expanded={isExpanded}
			>
				<div className="flex min-w-0 items-center gap-2">
					<span className={cn("font-bold text-base", levelText)}>{level}</span>
					<span className="text-muted-foreground">·</span>
					<span className="truncate text-muted-foreground text-sm">
						{LEVEL_LABELS[level]}
					</span>
				</div>
				<div className="flex shrink-0 items-center gap-3">
					<span className="text-muted-foreground text-sm">
						{completedCount}/{topics.length} topics
					</span>
					<ChevronDown
						className={cn(
							"size-4 text-muted-foreground transition-transform duration-200",
							!isExpanded && "-rotate-90",
						)}
					/>
				</div>
			</button>
			{isExpanded ? (
				<div className="flex flex-col gap-5 border-border/60 border-t p-4">
					{categoryGroups.map(([category, categoryTopics]) => {
						const Icon = getCategoryIcon(category);
						return (
							<div key={category} className="flex flex-col gap-3">
								<div className="flex items-center gap-1.5 px-1 text-muted-foreground">
									<Icon className="size-4" />
									<h4 className="font-medium text-sm">{category}</h4>
									<span className="h-px flex-1 bg-neutral-200" />
								</div>
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
									{categoryTopics.map((topic) => (
										<GrammarTopicCard
											key={topic.id}
											topic={topic}
											isRecommended={topic.id === topRecommendedId}
											onOpen={() => onOpen(topic.slug)}
										/>
									))}
								</div>
							</div>
						);
					})}
				</div>
			) : null}
		</section>
	);
}
