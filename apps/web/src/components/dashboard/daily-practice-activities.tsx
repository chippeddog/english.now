import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
	CheckIcon,
	ChevronRightIcon,
	ClockIcon,
	LoaderIcon,
	LockIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useUpgradeDialog } from "@/components/dashboard/upgrade-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	getActivityGateState,
	isFreePracticeLimitError,
} from "@/lib/feature-gating";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";
import PracticeSession, {
	type FlashcardItem,
} from "../vocabulary/practice-session";

type ParagraphPreview = {
	text: string;
	topic: string;
	cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1";
	wordCount: number;
	focusAreas: string[];
	tips: string;
};

type ConversationActivity = {
	id: string;
	emoji: string;
	title: string;
	description: string;
	duration: number;
	type: "conversation";
	typeLabel: string;
	startedAt: string | null;
	completedAt: string | null;
	sessionId: string | null;
	payload: {
		scenario: string;
		scenarioName: string;
		scenarioDescription: string;
		aiRole?: string;
		scenarioType: "topic" | "roleplay";
	};
};

type PronunciationActivity = {
	id: string;
	emoji: string;
	title: string;
	description: string;
	duration: number;
	type: "pronunciation";
	typeLabel: string;
	startedAt: string | null;
	completedAt: string | null;
	sessionId: string | null;
	payload: {
		paragraph: ParagraphPreview;
	};
};

type VocabularyActivity = {
	id: string;
	emoji: string;
	title: string;
	description: string;
	duration: number;
	type: "vocabulary";
	typeLabel: string;
	startedAt: string | null;
	completedAt: string | null;
	sessionId: string | null;
	payload: {
		cards: FlashcardItem[];
		focus: Array<"words" | "phrases">;
	};
};

type DailyPracticeActivity =
	| ConversationActivity
	| PronunciationActivity
	| VocabularyActivity;

function ActivitySkeleton({
	compact = false,
	className,
}: {
	compact?: boolean;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-col justify-between rounded-2xl border border-border/50 bg-white p-4",
				compact ? "min-h-48" : "min-h-44",
				className,
			)}
		>
			<div>
				<Skeleton className="mb-4 h-6 w-16 rounded-lg" />
				<Skeleton className="mb-2 size-9 rounded-lg" />
				<Skeleton className="mb-1 h-4 w-full rounded" />
				<Skeleton className="h-4 w-2/3 rounded" />
			</div>
			<div className="flex items-center justify-between">
				<Skeleton className="h-7 w-24 rounded-lg" />
				<Skeleton className="size-4 rounded" />
			</div>
		</div>
	);
}

const HOME_SKELETON_KEYS = [
	"home-1",
	"home-2",
	"home-3",
	"home-4",
	"home-5",
	"home-6",
	"home-7",
	"home-8",
	"home-9",
] as const;

const PRACTICE_SKELETON_KEYS = [
	"practice-1",
	"practice-2",
	"practice-3",
	"practice-4",
	"practice-5",
	"practice-6",
	"practice-7",
	"practice-8",
	"practice-9",
] as const;

function PreparingOverlay() {
	return (
		<div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl border border-border/50 bg-white/10 p-6 backdrop-blur-xs">
			<div className="max-w-xs rounded-2xl bg-neutral-200/50 px-4 py-3 text-center backdrop-blur-sm">
				<div className="flex animate-pulse items-center gap-2 font-medium text-neutral-500 text-sm">
					<LoaderIcon className="size-4 animate-spin text-muted-foreground" />
					<span>Preparing your daily practice</span>
				</div>
			</div>
		</div>
	);
}

export default function DailyPracticeActivities({
	variant,
}: {
	variant: "home" | "practice";
}) {
	const trpc = useTRPC();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [startingId, setStartingId] = useState<string | null>(null);
	const [vocabularyActivity, setVocabularyActivity] =
		useState<VocabularyActivity | null>(null);
	const [vocabularySessionKey, setVocabularySessionKey] = useState(0);
	const { openDialog: openUpgradeDialog } = useUpgradeDialog();

	const queryOptions =
		variant === "home"
			? trpc.practice.getHomeTodayPlan.queryOptions()
			: trpc.practice.getTodayPlan.queryOptions();

	const { data, isLoading } = useQuery({
		...queryOptions,
		refetchInterval: (query) => {
			const status = (query.state.data as { status?: string } | undefined)
				?.status;

			return status === "missing" ||
				status === "queued" ||
				status === "generating"
				? 3000
				: false;
		},
	});

	const ensurePlan = useMutation(
		trpc.practice.ensureTodayPlan.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.practice.getTodayPlan.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.practice.getHomeTodayPlan.queryKey(),
				});
			},
		}),
	);

	const startActivity = useMutation(
		trpc.practice.startActivity.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.practice.getTodayPlan.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.practice.getHomeTodayPlan.queryKey(),
				});
			},
		}),
	);

	const markDone = useMutation(
		trpc.practice.markActivityDone.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.practice.getTodayPlan.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.practice.getHomeTodayPlan.queryKey(),
				});
			},
		}),
	);

	const startPronunciation = useMutation(
		trpc.pronunciation.startSession.mutationOptions({}),
	);
	const startConversation = useMutation(
		trpc.conversation.start.mutationOptions({}),
	);

	useEffect(() => {
		if (
			(data?.status === "missing" || data?.status === "failed") &&
			!ensurePlan.isPending &&
			!ensurePlan.isSuccess
		) {
			ensurePlan.mutate();
		}
	}, [data?.status, ensurePlan.isPending, ensurePlan.isSuccess]);

	const activities = (data?.activities ?? []) as DailyPracticeActivity[];
	const access = data?.access ?? null;
	const completedCount =
		activities.filter((activity) => activity.completedAt !== null).length ?? 0;
	const isPreparingPlan =
		!isLoading &&
		(ensurePlan.isPending ||
			data?.status === "missing" ||
			data?.status === "queued" ||
			data?.status === "generating");

	async function handleStart(activity: DailyPracticeActivity) {
		if (activity.completedAt || startingId) return;

		if (activity.type === "conversation" || activity.type === "pronunciation") {
			const gateState = getActivityGateState(access, activity);

			if (gateState === "locked") {
				openUpgradeDialog();
				return;
			}
		}

		setStartingId(activity.id);

		try {
			if (activity.type === "conversation") {
				if (activity.sessionId) {
					navigate({
						to: "/conversation/$sessionId",
						params: { sessionId: activity.sessionId },
					});

					return;
				}

				const result = await startConversation.mutateAsync({
					activityId: activity.id,
				});

				navigate({
					to: "/conversation/$sessionId",
					params: { sessionId: result.sessionId },
				});

				return;
			}

			if (activity.type === "pronunciation") {
				if (activity.sessionId) {
					navigate({
						to: "/pronunciation/$sessionId",
						params: { sessionId: activity.sessionId },
					});

					return;
				}

				const result = await startPronunciation.mutateAsync({
					activityId: activity.id,
				});

				navigate({
					to: "/pronunciation/$sessionId",
					params: { sessionId: result.sessionId },
				});

				return;
			}

			if (!activity.startedAt && !activity.sessionId) {
				await startActivity.mutateAsync({
					activityId: activity.id,
					sessionId: `vocabulary:${activity.id}`,
				});
			}

			setVocabularySessionKey((key) => key + 1);
			setVocabularyActivity(activity);
		} catch (error) {
			if (isFreePracticeLimitError(error)) {
				openUpgradeDialog();
				return;
			}

			throw error;
		} finally {
			setStartingId(null);
		}
	}

	function handleVocabularyComplete() {
		if (!vocabularyActivity || vocabularyActivity.completedAt) return;

		markDone.mutate({
			activityId: vocabularyActivity.id,
			sessionId: `vocabulary:${vocabularyActivity.id}`,
		});
	}

	const emptyMessage =
		data?.status === "failed"
			? data.error || "We could not prepare today’s practice yet."
			: "We’re preparing today’s practice for you.";
	const homeCarouselClasses =
		"-mx-2.5 flex gap-3 overflow-x-auto px-2.5 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:items-stretch sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden";
	const homeCarouselItemClasses =
		"w-[64vw] max-w-50 shrink-0 sm:h-full sm:w-auto sm:max-w-none sm:shrink";

	return (
		<>
			<div
				className={cn(
					"relative overflow-hidden rounded-3xl bg-white",
					variant === "home" ? "p-2.5" : "border border-border/50 p-4",
				)}
				style={{
					boxShadow:
						variant === "home"
							? "0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)"
							: undefined,
				}}
			>
				<div className="mb-2.5 flex items-center justify-between gap-3 pr-1.5 pl-1.5">
					<div className="flex items-center gap-3">
						<h2 className="flex gap-2 font-bold font-lyon text-xl">
							{variant === "home" ? "Today's Practice" : "Today’s Plan"}
						</h2>
					</div>
					{activities.length > 0 && (
						<div className="font-normal text-muted-foreground text-sm">
							{completedCount}/{activities.length}
						</div>
					)}
				</div>

				{isLoading && activities.length === 0 ? (
					<div
						className={cn(
							"gap-3",
							variant === "home"
								? homeCarouselClasses
								: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
						)}
					>
						{(variant === "home"
							? HOME_SKELETON_KEYS
							: PRACTICE_SKELETON_KEYS
						).map((key) => (
							<ActivitySkeleton
								key={key}
								compact={variant === "home"}
								className={
									variant === "home" ? homeCarouselItemClasses : undefined
								}
							/>
						))}
					</div>
				) : isPreparingPlan && activities.length === 0 ? (
					<div className="relative">
						<div
							className={cn(
								"gap-3 transition duration-300",
								variant === "home"
									? `${homeCarouselClasses} blur-[2px]`
									: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
							)}
						>
							{(variant === "home"
								? HOME_SKELETON_KEYS
								: PRACTICE_SKELETON_KEYS
							).map((key) => (
								<ActivitySkeleton
									key={key}
									compact={variant === "home"}
									className={
										variant === "home" ? homeCarouselItemClasses : undefined
									}
								/>
							))}
						</div>
						<PreparingOverlay />
					</div>
				) : activities.length === 0 ? (
					<div className="rounded-2xl border border-border/60 border-dashed bg-neutral-50 px-4 py-6 text-center">
						<p className="text-muted-foreground text-sm">{emptyMessage}</p>
						<Button
							type="button"
							variant="outline"
							className="mt-3 rounded-xl"
							disabled={ensurePlan.isPending}
							onClick={() => ensurePlan.mutate()}
						>
							{ensurePlan.isPending ? "Preparing..." : "Try again"}
						</Button>
					</div>
				) : (
					<div
						className={cn(
							"gap-3",
							variant === "home"
								? homeCarouselClasses
								: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
						)}
					>
						{activities.map((activity) => {
							const isCompleted = activity.completedAt !== null;
							const isStarted =
								!isCompleted &&
								(activity.startedAt !== null || activity.sessionId !== null);
							const isStarting = startingId === activity.id;
							const gateState =
								activity.type === "conversation" ||
								activity.type === "pronunciation"
									? getActivityGateState(access, activity)
									: "available";
							const isLocked = gateState === "locked";
							const isResume = gateState === "resume";

							return (
								<button
									key={activity.id}
									type="button"
									disabled={isCompleted || isStarting}
									onClick={() => handleStart(activity)}
									className={cn(
										"group relative flex min-h-44 flex-col justify-between overflow-hidden rounded-2xl border p-4 text-left transition-all",
										variant === "home" && homeCarouselItemClasses,
										isCompleted
											? "border-lime-200 bg-lime-50/50"
											: isLocked
												? "cursor-pointer border-neutral-200 bg-neutral-50/70 hover:bg-neutral-50"
												: isStarted
													? "hover:-translate-y-0.5 cursor-pointer border-amber-200 bg-amber-50/50 hover:bg-amber-50"
													: "hover:-translate-y-0.5 cursor-pointer border-border/50 bg-white hover:bg-neutral-50",
										isStarting && "pointer-events-none opacity-70",
									)}
								>
									{isCompleted ? (
										<div className="absolute top-4 right-4 flex size-6 items-center justify-center rounded-full border border-lime-400 bg-lime-200 text-lime-600">
											<CheckIcon className="size-3.5" strokeWidth={3} />
										</div>
									) : isLocked ? (
										<div className="absolute top-4 right-4 flex size-6 items-center justify-center rounded-full border border-neutral-300 bg-neutral-100 text-neutral-500">
											<LockIcon className="size-3.5" />
										</div>
									) : isStarted ? (
										<div className="absolute top-4 right-4 flex size-6 items-center justify-center rounded-full border border-amber-400 bg-amber-200 text-amber-600">
											<ClockIcon className="size-3.5" />
										</div>
									) : null}

									<div>
										<Badge
											variant="outline"
											className={cn(
												"mb-4 rounded-lg px-2 py-0.5 font-normal text-xs italic",
												isCompleted
													? "border-lime-200 bg-lime-50 text-lime-700"
													: isLocked
														? "border-neutral-200 bg-neutral-100 text-neutral-600"
														: isStarted
															? "border-amber-200 bg-amber-50 text-amber-700"
															: "border-neutral-200",
											)}
										>
											{activity.duration}{" "}
											{activity.duration === 1 ? "minute" : "minutes"}
										</Badge>
										<div className="mb-2 text-2xl xl:text-4xl">
											{activity.emoji}
										</div>
										<h3
											className={cn(
												"mb-1 font-semibold text-sm leading-snug",
												isCompleted && "text-lime-900",
												isStarted && "text-amber-900",
											)}
										>
											{activity.title}
										</h3>
										{/* <p className="text-muted-foreground text-xs leading-relaxed">
											{activity.description}
										</p> */}
									</div>

									<div className="mt-3 flex items-center justify-between">
										<span
											className={cn(
												"flex items-center gap-1 whitespace-nowrap rounded-xl border px-2.5 py-1.5 font-medium text-xs italic transition",
												isCompleted
													? "border-lime-200 bg-lime-50 text-lime-700"
													: isLocked
														? "border-neutral-200 bg-neutral-100 text-neutral-600"
														: isStarted
															? "border-amber-200 bg-amber-50 text-amber-700"
															: "border-neutral-200 text-neutral-700 hover:brightness-95",
											)}
										>
											{isLocked
												? "Upgrade to unlock"
												: isResume
													? "Resume"
													: activity.typeLabel}
										</span>
										{isStarting ? (
											<LoaderIcon className="size-4 animate-spin text-muted-foreground" />
										) : isCompleted ? null : isLocked ? null : isStarted ? // <span className="font-medium text-amber-700 text-xs italic">
										// 	Continue
										// </span>
										null : (
											<ChevronRightIcon
												className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
												strokeWidth={2}
											/>
										)}
									</div>
								</button>
							);
						})}
					</div>
				)}
			</div>

			{vocabularyActivity && (
				<PracticeSession
					key={vocabularySessionKey}
					cards={vocabularyActivity.payload.cards}
					onClose={() => setVocabularyActivity(null)}
					onRestart={() => {
						setVocabularyActivity(null);
						requestAnimationFrame(() => {
							setVocabularySessionKey((key) => key + 1);
							setVocabularyActivity(vocabularyActivity);
						});
					}}
					onComplete={handleVocabularyComplete}
				/>
			)}
		</>
	);
}
