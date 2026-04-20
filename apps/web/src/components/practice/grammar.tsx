import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, BookOpenIcon, ChevronRight, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	StatusBadge,
	type TopicListItem,
} from "@/components/practice/grammar-route-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

type GrammarOverview = {
	totalTopics: number;
	completedTopics: number;
	inProgressTopics: number;
	progressAverage: number;
	bookmarkedTopics: number;
	currentTopic: {
		id: string;
		slug: string;
		title: string;
		category: string;
		activeSessionId: string | null;
	} | null;
};

type SuggestedTopic = TopicListItem & {
	reason: string;
	score: number;
};

function GrammarDialogSkeleton() {
	return (
		<div className="space-y-4">
			<div className="rounded-3xl border border-border/50 bg-white p-5">
				<div className="mb-3 flex items-center gap-2">
					<Skeleton className="h-6 w-14 rounded-full" />
					<Skeleton className="h-6 w-24 rounded-full" />
				</div>
				<Skeleton className="h-8 w-2/3 rounded-xl" />
				<Skeleton className="mt-3 h-4 w-full rounded" />
				<Skeleton className="mt-2 h-4 w-[88%] rounded" />
				<div className="mt-5 grid grid-cols-3 gap-2">
					<Skeleton className="h-16 rounded-2xl" />
					<Skeleton className="h-16 rounded-2xl" />
					<Skeleton className="h-16 rounded-2xl" />
				</div>
			</div>
			<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
				<Skeleton className="h-24 rounded-2xl" />
				<Skeleton className="h-24 rounded-2xl" />
				<Skeleton className="h-24 rounded-2xl" />
			</div>
		</div>
	);
}

function getSuggestionReason(
	topic: TopicListItem,
	overview: GrammarOverview | undefined,
) {
	if (
		overview?.currentTopic?.slug === topic.slug ||
		topic.status === "in_progress"
	) {
		return "Continue where you left off";
	}

	if (topic.bookmark) {
		return "Saved for focused review";
	}

	if (topic.drillItemCount > 0 && topic.status !== "completed") {
		return "Ready for a quick drill";
	}

	if (topic.status === "completed") {
		return "Review to keep it sharp";
	}

	return "Recommended next for your current path";
}

function rankTopic(
	topic: TopicListItem,
	overview: GrammarOverview | undefined,
) {
	let score = 0;

	if (overview?.currentTopic?.slug === topic.slug) {
		score += 140;
	}

	if (topic.status === "in_progress") {
		score += 120;
	}

	if (topic.bookmark) {
		score += 40;
	}

	if (topic.drillItemCount > 0) {
		score += Math.min(24, topic.drillItemCount * 4);
	}

	if (topic.activeSessionId) {
		score += 16;
	}

	if (topic.status === "not_started") {
		score += 28;
	}

	if (topic.mastery === "learning") {
		score += 18;
	}

	if (topic.status === "completed") {
		score += 8;
	}

	if (topic.status === "locked") {
		score -= 100;
	}

	return score;
}

function PersonalizedGrammarDialog({
	open,
	setOpen,
}: {
	open: boolean;
	setOpen: (open: boolean) => void;
}) {
	const navigate = useNavigate();
	const trpc = useTRPC();
	const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

	const { data: overview, isLoading: isOverviewLoading } = useQuery({
		...trpc.grammar.getOverview.queryOptions(),
		enabled: open,
	});
	const { data: catalog, isLoading: isCatalogLoading } = useQuery({
		...trpc.grammar.getCatalog.queryOptions(),
		enabled: open,
	});

	const suggestions = useMemo<SuggestedTopic[]>(() => {
		const topics = (catalog?.topics ?? []) as TopicListItem[];

		return [...topics]
			.sort((left, right) => {
				const rightScore = rankTopic(right, overview);
				const leftScore = rankTopic(left, overview);

				if (rightScore !== leftScore) {
					return rightScore - leftScore;
				}

				if (left.progress !== right.progress) {
					return right.progress - left.progress;
				}

				return left.title.localeCompare(right.title);
			})
			.map((topic) => ({
				...topic,
				score: rankTopic(topic, overview),
				reason: getSuggestionReason(topic, overview),
			}));
	}, [catalog?.topics, overview]);

	const preferredSuggestions = useMemo(() => {
		const unlocked = suggestions.filter((topic) => topic.status !== "locked");
		return (unlocked.length > 0 ? unlocked : suggestions).slice(0, 4);
	}, [suggestions]);

	useEffect(() => {
		if (preferredSuggestions.length === 0) {
			if (selectedSlug) {
				setSelectedSlug(null);
			}
			return;
		}

		if (
			!selectedSlug ||
			!preferredSuggestions.some((topic) => topic.slug === selectedSlug)
		) {
			setSelectedSlug(preferredSuggestions[0]?.slug ?? null);
		}
	}, [preferredSuggestions, selectedSlug]);

	const selectedTopic =
		preferredSuggestions.find((topic) => topic.slug === selectedSlug) ??
		preferredSuggestions[0] ??
		null;
	const relatedSuggestions = preferredSuggestions.filter(
		(topic) => topic.slug !== selectedTopic?.slug,
	);
	const isLoading = isOverviewLoading || isCatalogLoading;

	const openTopic = (slug: string) => {
		setOpen(false);
		navigate({
			to: "/practice/grammar/$slug",
			params: { slug },
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent showCloseButton={false}>
				<div className="mb-4 flex flex-col gap-2 text-center">
					<h1 className="font-bold font-lyon text-2xl tracking-tight md:text-3xl">
						Grammar topics
					</h1>
					<p className="text-muted-foreground text-sm md:text-base">
						Pick a topic to practice
					</p>
				</div>

				{isLoading ? (
					<GrammarDialogSkeleton />
				) : !selectedTopic ? (
					<div className="rounded-3xl border border-border/60 border-dashed bg-neutral-50 px-6 py-10 text-center">
						<div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-white shadow-sm">
							<BookOpenIcon className="size-5 text-muted-foreground" />
						</div>
						<h2 className="font-semibold text-lg">No grammar topics yet</h2>
						<p className="mx-auto mt-2 max-w-md text-muted-foreground text-sm">
							Your grammar library is still empty. Open the grammar page to
							check again once topics are available.
						</p>
					</div>
				) : (
					<div className="space-y-4">
						<div className="rounded-[1.75rem] border border-border/50 bg-white p-5 shadow-sm">
							<div className="mb-3 flex flex-wrap items-center gap-2">
								<Badge variant={selectedTopic.level}>
									{selectedTopic.level}
								</Badge>
								<StatusBadge status={selectedTopic.status} />
								<Badge variant="secondary">{selectedTopic.category}</Badge>
							</div>
							<div className="flex items-start justify-between gap-4">
								<div className="min-w-0">
									<div className="mb-2 inline-flex items-center gap-2 rounded-full bg-lime-100 px-3 py-1 font-medium text-lime-800 text-xs">
										<Sparkles className="size-3.5" />
										{selectedTopic.reason}
									</div>
									<h2 className="font-semibold text-slate-900 text-xl">
										{selectedTopic.title}
									</h2>
									<p className="mt-2 text-muted-foreground text-sm leading-relaxed">
										{selectedTopic.description || selectedTopic.summary}
									</p>
								</div>
							</div>
						</div>

						{relatedSuggestions.length > 0 ? (
							<div>
								<div className="mb-2 flex items-center justify-between">
									<h3 className="font-semibold text-sm italic">
										More suggestions
									</h3>
									{overview ? (
										<p className="text-muted-foreground text-xs">
											{overview.inProgressTopics} in progress ·{" "}
											{overview.bookmarkedTopics} saved
										</p>
									) : null}
								</div>
								<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
									{relatedSuggestions.slice(0, 3).map((topic) => (
										<button
											key={topic.id}
											type="button"
											onClick={() => setSelectedSlug(topic.slug)}
											className={cn(
												"rounded-2xl border p-3 text-left transition-all hover:border-border hover:bg-neutral-50",
												selectedSlug === topic.slug
													? "border-lime-300 bg-lime-50"
													: "border-border/50 bg-white",
											)}
										>
											<div className="mb-2 flex flex-wrap items-center gap-2">
												<Badge variant={topic.level}>{topic.level}</Badge>
												<StatusBadge status={topic.status} />
											</div>
											<h4 className="font-medium text-slate-900 text-sm">
												{topic.title}
											</h4>
											<p className="mt-1 line-clamp-2 text-muted-foreground text-xs">
												{topic.reason}
											</p>
										</button>
									))}
								</div>
							</div>
						) : null}
					</div>
				)}

				<DialogFooter className="mt-2">
					<Button
						type="button"
						variant="ghost"
						className="rounded-xl italic"
						onClick={() => {
							setOpen(false);
							navigate({ to: "/practice/grammar" });
						}}
					>
						Browse all grammar
						<ArrowRight className="size-4" />
					</Button>
					<DialogClose asChild>
						<Button
							variant="ghost"
							className="flex-1 rounded-xl italic sm:flex-none"
						>
							Cancel
						</Button>
					</DialogClose>
					<Button
						type="button"
						onClick={() => {
							if (selectedTopic) {
								openTopic(selectedTopic.slug);
							}
						}}
						disabled={!selectedTopic}
						className="rounded-xl"
					>
						{selectedTopic?.status === "in_progress"
							? "Resume topic"
							: "Start practice"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function Grammar() {
	const { t } = useTranslation("app");
	const [dialogOpen, setDialogOpen] = useState(false);

	return (
		<div
			className="overflow-hidden rounded-[1.2rem] bg-white transition-all hover:scale-[1.02]"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<PersonalizedGrammarDialog open={dialogOpen} setOpen={setDialogOpen} />
			<button
				type="button"
				onClick={() => {
					setDialogOpen(true);
				}}
				className="group flex w-full cursor-pointer items-center justify-between p-2.5 sm:items-start sm:p-3 md:items-center"
			>
				<div className="flex items-center gap-2.5 sm:flex-col sm:items-start md:flex-row md:items-center md:gap-3">
					<div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#C6F64D] bg-radial from-[#EFFF9B] to-[#D8FF76] sm:size-8 md:size-10">
						<BookOpenIcon className="size-4.5 text-lime-700 sm:size-4 md:size-5" />
					</div>
					<div className="min-w-0 flex-1 text-left">
						<h2 className="font-medium text-zinc-900">
							{t("practice.grammar")}
						</h2>
						<p className="text-muted-foreground text-sm">
							{t("practice.practiceYourGrammar")}
						</p>
					</div>
				</div>
				<ChevronRight
					strokeWidth={2}
					className="size-4.5 text-muted-foreground transition-all duration-300 group-hover:text-zinc-700"
				/>
			</button>
		</div>
	);
}
