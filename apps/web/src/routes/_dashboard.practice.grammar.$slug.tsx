import { useTranslation } from "@english.now/i18n";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import GrammarTheory from "@/components/lesson/theory/grammar-theory";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { createTitle } from "@/utils/title";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_dashboard/practice/grammar/$slug")({
	component: GrammarTopicPage,
	head: () => ({
		meta: [
			{
				title: createTitle("Grammar"),
			},
		],
	}),
});

function GrammarTopicPage() {
	const trpc = useTRPC();
	const navigate = useNavigate();
	const { t } = useTranslation("app");
	const { slug } = Route.useParams();

	const { data: catalog, isLoading: isCatalogLoading } = useQuery(
		trpc.grammar.getCatalog.queryOptions(),
	);
	const {
		data: selectedTopic,
		isLoading: isTopicLoading,
		error: selectedTopicError,
	} = useQuery({
		...trpc.grammar.getTopic.queryOptions({
			topicId: slug,
		}),
		enabled: Boolean(slug),
	});

	const startDrill = useMutation(
		trpc.grammar.startDrillSession.mutationOptions({
			onSuccess: ({ sessionId }) => {
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

	const selectedTopicSummary =
		catalog?.topics.find((topic) => topic.slug === slug) ?? null;
	const selectedTopicStatus =
		selectedTopic?.status ?? selectedTopicSummary?.status ?? "not_started";
	const drillItemCount =
		selectedTopic?.drillItemCount ?? selectedTopicSummary?.drillItemCount ?? 0;
	const hasDrills = drillItemCount > 0;
	const activeSessionId =
		selectedTopic?.activeSessionId ??
		selectedTopicSummary?.activeSessionId ??
		null;
	const detailButtonLabel = activeSessionId
		? t("practice.continue")
		: selectedTopicStatus === "completed"
			? t("grammar.review.practiceAgain")
			: t("grammar.startPractice");

	const handleStartDrill = () => {
		if (!selectedTopic || !hasDrills || startDrill.isPending) {
			return;
		}

		if (activeSessionId) {
			navigate({
				to: "/grammar/$sessionId",
				params: { sessionId: activeSessionId },
			});
			return;
		}

		startDrill.mutate({ topicId: selectedTopic.id });
	};

	if (
		(isCatalogLoading && !catalog) ||
		(isTopicLoading && !selectedTopicSummary)
	) {
		return (
			<div className="min-h-screen">
				<div className="container relative z-10 mx-auto max-w-5xl px-4 py-6 pt-8">
					<Skeleton className="mb-4 h-10 w-44" />
					<Skeleton className="mb-6 h-48 rounded-3xl" />
					<Skeleton className="h-112 rounded-3xl" />
				</div>
			</div>
		);
	}

	if (!selectedTopicSummary || (!selectedTopic && selectedTopicError)) {
		return (
			<div className="min-h-screen">
				<div className="container relative z-10 mx-auto max-w-5xl px-4 py-6 pt-8">
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate({ to: "/practice" })}
						className="mb-4 rounded-xl"
					>
						<ArrowLeft className="size-4" />
						Back to practice
					</Button>
					<div className="rounded-3xl border border-border/50 bg-white p-8 text-center shadow-sm">
						<h1 className="font-bold font-lyon text-3xl tracking-tight">
							Topic not found
						</h1>
						<p className="mx-auto mt-3 max-w-md text-muted-foreground">
							This grammar topic does not exist or is not available in your
							current catalog.
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			<div className="container relative z-10 mx-auto max-w-5xl px-4 py-6 pt-8">
				<Button
					type="button"
					variant="outline"
					onClick={() => navigate({ to: "/practice" })}
					className="mb-4 rounded-xl"
				>
					<ArrowLeft className="size-4" />
					Back to practice
				</Button>

				<div className="rounded-3xl border border-border/50 bg-white shadow-sm">
					<div className="border-border/50 border-b p-5">
						<div className="flex flex-col gap-4">
							{/* <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
								<div>
									<div className="mb-2 flex flex-wrap items-center gap-2">
										<Badge variant={selectedTopicSummary.level}>
											{selectedTopicSummary.level}
										</Badge>
										<StatusBadge status={selectedTopicStatus} />
									</div>
									<h1 className="font-bold font-lyon text-2xl">
										{selectedTopicSummary.title}
									</h1>
									<p className="mt-2 max-w-2xl text-muted-foreground">
										{selectedTopicSummary.description ||
											selectedTopicSummary.summary}
									</p>
								</div>
								<div className="flex flex-col gap-2 md:items-end">
									<div className="flex items-center gap-2 text-muted-foreground text-sm">
										<Clock3 className="size-4" />
										<span>
											{selectedTopicSummary.estimatedMinutes
												? `${selectedTopicSummary.estimatedMinutes} min topic`
												: "Estimated time coming soon"}
										</span>
									</div>
									<div className="flex items-center gap-2 text-muted-foreground text-sm">
										<Sparkles className="size-4" />
										<span>{selectedTopicSummary.category}</span>
									</div>
									<div className="text-muted-foreground text-sm">
										Mastery:{" "}
										<span className="font-medium text-foreground capitalize">
											{selectedTopicSummary.mastery.replaceAll("_", " ")}
										</span>
									</div>
									<div className="text-muted-foreground text-sm">
										{hasDrills
											? `${drillItemCount} drill ${
													drillItemCount === 1 ? "question" : "questions"
												}`
											: "No drill questions yet"}
									</div>
								</div>
							</div> */}

							<div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-end">
								<div>
									<div className="mb-2 flex items-center justify-between text-xs">
										<span className="text-muted-foreground">
											{selectedTopicStatus === "completed"
												? "Topic completed"
												: selectedTopicStatus === "in_progress"
													? "Practice in progress"
													: "Ready to practice"}
										</span>
										<span className="font-medium text-foreground">
											{selectedTopicSummary.progress}%
										</span>
									</div>
									<Progress
										value={selectedTopicSummary.progress}
										className="h-2 bg-muted"
									/>
								</div>
							</div>
						</div>
					</div>

					{isTopicLoading ? (
						<div className="p-6">
							<Skeleton className="mb-4 h-8 w-48" />
							<Skeleton className="mb-3 h-4 w-full" />
							<Skeleton className="mb-3 h-4 w-[92%]" />
							<Skeleton className="h-4 w-[76%]" />
						</div>
					) : selectedTopic?.content ? (
						<div>
							<GrammarTheory
								content={{ ...selectedTopic.content, type: "grammar" }}
								title={selectedTopicSummary.title}
								description={
									selectedTopicSummary.description ||
									selectedTopicSummary.summary
								}
								onContinue={handleStartDrill}
								continueLabel={
									startDrill.isPending ? "Starting..." : detailButtonLabel
								}
								continueDisabled={!hasDrills || startDrill.isPending}
							/>
						</div>
					) : (
						<div className="p-6 text-muted-foreground">
							The full explanation for this grammar topic is not available yet.
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
