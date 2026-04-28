import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	type CefrLevel,
	GrammarLevelSection,
} from "@/components/practice/grammar/grammar-level-section";
import { GrammarTopicCardSkeleton } from "@/components/practice/grammar/grammar-topic-card";
import { GrammarTopicDetailView } from "@/components/practice/grammar/grammar-topic-detail-view";
import type { TopicListItem } from "@/components/practice/grammar-route-shared";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/utils/trpc";
import GrammarEmptyState from "./grammar-empty-state";

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

const LEVEL_LABELS: Record<CefrLevel, string> = {
	A1: "Beginner",
	A2: "Elementary",
	B1: "Intermediate",
	B2: "Upper-Intermediate",
	C1: "Advanced",
	C2: "Proficiency",
};

export function GrammarPickerDialog({
	open,
	setOpen,
}: {
	open: boolean;
	setOpen: (open: boolean) => void;
}) {
	const navigate = useNavigate();
	const trpc = useTRPC();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
	const [pendingScrollLevel, setPendingScrollLevel] =
		useState<CefrLevel | null>(null);
	const [expandedLevels, setExpandedLevels] = useState<Set<CefrLevel>>(
		() => new Set<CefrLevel>(LEVELS),
	);
	const levelRefs = useRef(new Map<CefrLevel, HTMLDivElement>());

	const { data: overview, isLoading: isOverviewLoading } = useQuery({
		...trpc.grammar.getOverview.queryOptions(),
		enabled: open,
	});
	const { data: catalog, isLoading: isCatalogLoading } = useQuery({
		...trpc.grammar.getCatalog.queryOptions(),
		enabled: open,
	});

	useEffect(() => {
		if (!open) {
			setSearchQuery("");
			setSelectedSlug(null);
		}
	}, [open]);

	const topics = (catalog?.topics ?? []) as TopicListItem[];

	const filteredTopics = useMemo(() => {
		const normalizedQuery = searchQuery.trim().toLowerCase();

		return topics
			.filter((topic) => {
				if (topic.status === "locked") return false;

				if (!normalizedQuery) return true;

				const searchable = [
					topic.title,
					topic.summary,
					topic.description,
					topic.category,
					topic.ruleTitles.join(" "),
					topic.vocabulary.join(" "),
					topic.objectives.join(" "),
				]
					.filter(Boolean)
					.join(" ")
					.toLowerCase();

				return searchable.includes(normalizedQuery);
			})
			.sort((left, right) => {
				if (left.level !== right.level) {
					return left.level.localeCompare(right.level);
				}
				return left.title.localeCompare(right.title);
			});
	}, [topics, searchQuery]);

	const topicsByLevel = useMemo(() => {
		const groups: Record<CefrLevel, TopicListItem[]> = {
			A1: [],
			A2: [],
			B1: [],
			B2: [],
			C1: [],
			C2: [],
		};
		for (const topic of filteredTopics) {
			const level = topic.level as CefrLevel;
			if (groups[level]) {
				groups[level].push(topic);
			}
		}
		return groups;
	}, [filteredTopics]);

	const visibleLevels = useMemo(
		() => LEVELS.filter((level) => topicsByLevel[level].length > 0),
		[topicsByLevel],
	);

	const levelTopicCounts = useMemo(() => {
		const counts: Record<CefrLevel, number> = {
			A1: 0,
			A2: 0,
			B1: 0,
			B2: 0,
			C1: 0,
			C2: 0,
		};

		for (const topic of topics) {
			if (topic.status === "locked") continue;

			const level = topic.level as CefrLevel;
			if (counts[level] !== undefined) {
				counts[level] += 1;
			}
		}

		return counts;
	}, [topics]);

	useEffect(() => {
		if (!searchQuery.trim()) return;
		setExpandedLevels((prev) => {
			const next = new Set(prev);
			for (const level of visibleLevels) {
				next.add(level);
			}
			return next;
		});
	}, [searchQuery, visibleLevels]);

	useEffect(() => {
		if (!pendingScrollLevel || searchQuery.trim()) return;

		const target = levelRefs.current.get(pendingScrollLevel);
		if (!target) return;

		target.scrollIntoView({ behavior: "smooth", block: "start" });
		setPendingScrollLevel(null);
	}, [pendingScrollLevel, searchQuery]);

	const toggleLevel = (level: CefrLevel) => {
		setExpandedLevels((prev) => {
			const next = new Set(prev);
			if (next.has(level)) {
				next.delete(level);
			} else {
				next.add(level);
			}
			return next;
		});
	};

	const scrollToLevel = (level: CefrLevel) => {
		setSearchQuery("");
		setExpandedLevels((prev) => {
			const next = new Set(prev);
			next.add(level);
			return next;
		});
		setPendingScrollLevel(level);
	};

	const openTopic = (slug: string) => {
		setSelectedSlug(slug);
	};

	const openReview = () => {
		setOpen(false);
		navigate({ to: "/grammar/review" });
	};

	const isLoading = isOverviewLoading || isCatalogLoading;
	const dueMistakes = overview?.dueMistakesCount ?? 0;

	const levelOptions = LEVELS.map((level) => ({
		id: level,
		label: LEVEL_LABELS[level],
		count: levelTopicCounts[level],
	}));

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="flex h-[min(80vh,720px)] w-full max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
				{selectedSlug ? (
					<GrammarTopicDetailView
						slug={selectedSlug}
						onBack={() => setSelectedSlug(null)}
						onClose={() => setOpen(false)}
					/>
				) : (
					<>
						<div className="flex items-center gap-3 border-border/60 border-b px-6 py-4">
							<div className="min-w-0 flex-1">
								<DialogTitle className="font-lyon font-semibold text-2xl">
									Grammar Topics
								</DialogTitle>
							</div>
						</div>

						<div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[240px_1fr]">
							<aside className="flex flex-col gap-4 border-border/60 border-b p-4 md:border-r md:border-b-0">
								<div className="relative">
									<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
									<Input
										value={searchQuery}
										onChange={(event) => setSearchQuery(event.target.value)}
										placeholder="Search topics"
										className="rounded-xl bg-white pl-9"
									/>
								</div>

								<div className="flex flex-col gap-2">
									<p className="px-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
										Levels
									</p>
									<div className="flex flex-col gap-1">
										{levelOptions.map((level) => {
											const isUnavailable = level.count === 0;

											return (
												<button
													key={level.id}
													type="button"
													onClick={() => scrollToLevel(level.id)}
													disabled={isUnavailable}
													className="flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
												>
													<span className="font-medium text-slate-800">
														{level.label}
													</span>
													<span className="text-muted-foreground text-xs">
														{level.id}
													</span>
												</button>
											);
										})}
									</div>
								</div>

								<div className="mt-auto">
									<button
										type="button"
										onClick={openReview}
										className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-white p-3 text-left transition-colors hover:bg-neutral-50"
									>
										<div className="flex items-center gap-2">
											<div>
												<p className="font-medium text-sm">Review mistakes</p>
												<p className="text-muted-foreground text-xs">
													{dueMistakes === 0
														? "Nothing due right now"
														: dueMistakes === 1
															? "1 due mistake"
															: `${dueMistakes} due mistakes`}
												</p>
											</div>
										</div>
										<ChevronRight className="size-4 text-muted-foreground" />
									</button>
								</div>
							</aside>

							<div className="min-h-0 overflow-y-auto bg-neutral-50/60 p-5">
								{isLoading ? (
									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
										{["s-1", "s-2", "s-3", "s-4", "s-5", "s-6"].map((key) => (
											<GrammarTopicCardSkeleton key={key} skeletonKey={key} />
										))}
									</div>
								) : filteredTopics.length === 0 ? (
									<GrammarEmptyState searchQuery={!!searchQuery} />
								) : (
									<div className="flex flex-col gap-4">
										{visibleLevels.map((level) => (
											<div
												key={level}
												ref={(node) => {
													if (node) {
														levelRefs.current.set(level, node);
													} else {
														levelRefs.current.delete(level);
													}
												}}
											>
												<GrammarLevelSection
													level={level}
													topics={topicsByLevel[level]}
													isExpanded={expandedLevels.has(level)}
													onToggle={() => toggleLevel(level)}
													topRecommendedId={null}
													onOpen={openTopic}
												/>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
