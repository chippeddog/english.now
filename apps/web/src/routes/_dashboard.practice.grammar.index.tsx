import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
	GrammarEmptyState,
	GrammarPageSkeleton,
	StatusBadge,
	type TopicListItem,
} from "@/components/practice/grammar-route-shared";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createTitle } from "@/utils/title";
import { useTRPC } from "@/utils/trpc";

const STATUS_OPTIONS = [
	{ value: "all", label: "All topics" },
	{ value: "not_started", label: "Not started" },
	{ value: "in_progress", label: "In progress" },
	{ value: "completed", label: "Completed" },
	{ value: "locked", label: "Locked" },
] as const;

type StatusFilter = (typeof STATUS_OPTIONS)[number]["value"];

export const Route = createFileRoute("/_dashboard/practice/grammar/")({
	component: GrammarIndexPage,
	head: () => ({
		meta: [
			{
				title: createTitle("Grammar"),
			},
		],
	}),
});

function GrammarIndexPage() {
	const trpc = useTRPC();
	const navigate = useNavigate();
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [levelFilter, setLevelFilter] = useState("all");
	const [categoryFilter, setCategoryFilter] = useState("all");

	const { data: catalog, isLoading: isCatalogLoading } = useQuery(
		trpc.grammar.getCatalog.queryOptions(),
	);

	const filteredTopics = useMemo(() => {
		if (!catalog) {
			return [];
		}

		const normalizedQuery = searchQuery.trim().toLowerCase();

		return catalog.topics.filter((topic: TopicListItem) => {
			if (statusFilter !== "all" && topic.status !== statusFilter) {
				return false;
			}

			if (levelFilter !== "all" && topic.level !== levelFilter) {
				return false;
			}

			if (categoryFilter !== "all" && topic.category !== categoryFilter) {
				return false;
			}

			if (!normalizedQuery) {
				return true;
			}

			const searchableText = [
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

			return searchableText.includes(normalizedQuery);
		});
	}, [catalog, categoryFilter, levelFilter, searchQuery, statusFilter]);

	const availableLevels = Array.from(
		new Set((catalog?.topics ?? []).map((topic: TopicListItem) => topic.level)),
	);
	const availableCategories = Array.from(
		new Set(
			(catalog?.topics ?? []).map((topic: TopicListItem) => topic.category),
		),
	);

	if (isCatalogLoading && !catalog) {
		return <GrammarPageSkeleton />;
	}

	if (!catalog || catalog.topics.length === 0) {
		return <GrammarEmptyState />;
	}

	return (
		<div className="min-h-screen">
			<div className="container relative z-10 mx-auto max-w-5xl px-4 py-6 pt-8">
				<div className="mb-6 flex flex-col gap-2">
					<div className="flex items-start justify-between gap-4">
						<div>
							<h1 className="font-bold font-lyon text-3xl tracking-tight md:text-3xl">
								Grammar
							</h1>
						</div>
						<div>
							<div className="flex flex-col justify-end gap-4 md:flex-row md:items-center">
								<div className="relative w-full md:max-w-md">
									<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
									<Input
										value={searchQuery}
										onChange={(event) => setSearchQuery(event.target.value)}
										placeholder="Search titles, rules, examples, or vocabulary"
										className="rounded-xl bg-white pl-9"
									/>
								</div>
								<div className="flex flex-col gap-3 md:flex-row md:items-center">
									<Select value={levelFilter} onValueChange={setLevelFilter}>
										<SelectTrigger className="h-10 min-w-32 rounded-xl bg-white">
											<SelectValue placeholder="All levels" />
										</SelectTrigger>
										<SelectContent align="end">
											<SelectItem value="all">All levels</SelectItem>
											{availableLevels.map((level) => (
												<SelectItem key={level} value={level}>
													{level}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Select
										value={categoryFilter}
										onValueChange={setCategoryFilter}
									>
										<SelectTrigger className="h-10 min-w-40 rounded-xl bg-white">
											<SelectValue placeholder="All categories" />
										</SelectTrigger>
										<SelectContent align="end">
											<SelectItem value="all">All categories</SelectItem>
											{availableCategories.map((category) => (
												<SelectItem key={category} value={category}>
													{category}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-stretch">
					<div className="flex w-1/4 flex-col gap-2">
						<div className="flex w-full flex-col gap-2 rounded-2xl border border-border/50 bg-muted/40 p-1">
							{STATUS_OPTIONS.map((option) => (
								<button
									key={option.value}
									type="button"
									onClick={() => setStatusFilter(option.value)}
									className={cn(
										"flex h-[34px] items-center rounded-xl px-3 font-medium text-muted-foreground text-sm italic transition-all",
										statusFilter === option.value &&
											"bg-background text-foreground shadow-sm",
									)}
								>
									{option.label}
								</button>
							))}
						</div>
					</div>
					{filteredTopics.length === 0 ? (
						<div className="w-full rounded-3xl border border-border border-dashed bg-white px-6 py-12 text-center">
							<p className="font-medium text-lg">
								No grammar topics match these filters.
							</p>
							<p className="mt-2 text-muted-foreground">
								Try a broader search or switch to a different progress state.
							</p>
						</div>
					) : (
						<div className="grid w-3/4 grid-cols-1 gap-3 md:grid-cols-2">
							{filteredTopics.map((topic) => (
								<button
									key={topic.id}
									type="button"
									onClick={() =>
										navigate({
											to: "/practice/grammar/$slug",
											params: { slug: topic.slug },
										})
									}
									className="rounded-3xl border border-border/50 bg-white p-4 text-left transition-all hover:border-border hover:shadow-md"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<div className="mb-2 flex flex-wrap items-center gap-2">
												<Badge variant={topic.level}>{topic.level}</Badge>
												<StatusBadge status={topic.status} />
												{topic.bookmark ? (
													<Badge variant="secondary">Saved</Badge>
												) : null}
											</div>
											<h2 className="line-clamp-2 font-semibold text-lg text-slate-900">
												{topic.title}
											</h2>
											<p className="mt-1 text-muted-foreground text-sm">
												{topic.estimatedMinutes
													? `${topic.estimatedMinutes} min`
													: ""}
												{topic.drillItemCount > 0
													? `${topic.estimatedMinutes ? "  ·  " : ""}${
															topic.drillItemCount
														} drill ${
															topic.drillItemCount === 1
																? "question"
																: "questions"
														}`
													: ""}
											</p>
										</div>
										<span className="font-medium text-foreground">
											{topic.progress}%
										</span>
									</div>

									{/* <p className="mt-3 line-clamp-3 text-neutral-700 text-sm">
										{topic.description ||
											topic.summary ||
											"Open this topic to review the full explanation and examples."}
									</p> */}
									<div className="mt-4 flex items-center justify-between gap-2">
										<div className="flex items-center gap-1 whitespace-nowrap rounded-xl border border-neutral-200 px-2.5 py-1.5 font-medium text-neutral-700 text-xs italic transition hover:brightness-95">
											{topic.category}
										</div>
										<ChevronRight className="size-4 text-muted-foreground" />
									</div>
									{/* <div className="mt-4">
										<div className="mb-2 flex items-center justify-between text-xs">
											<span className="text-muted-foreground">
												{topic.status === "in_progress"
													? "Practice progress"
													: topic.status === "completed"
														? "Completed"
														: topic.status === "locked"
															? "Locked"
															: "Ready to start"}
											</span>
											<span className="font-medium text-foreground">
												{topic.progress}%
											</span>
										</div>
										<Progress value={topic.progress} className="h-2 bg-muted" />
									</div> */}
								</button>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
