import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRightIcon, CheckIcon, LoaderIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

type DailyActivity = {
	id: string;
	emoji: string;
	title: string;
	description: string;
	duration: number;
	type: "pronunciation" | "conversation";
	typeLabel: string;
	metadata: {
		scenario?: string;
		scenarioName?: string;
		scenarioDescription?: string;
		aiRole?: string;
		cefrLevel?: string;
	};
	completedAt: string | null;
	sessionId: string | null;
};

function ActivitySkeleton() {
	return (
		<div className="flex min-h-48 flex-col justify-between rounded-2xl border border-border/50 bg-white p-4">
			<div>
				<Skeleton className="mb-4 h-6 w-16 rounded-lg" />
				<Skeleton className="mb-2 size-9 rounded-lg" />
				<Skeleton className="mb-1 h-4 w-full rounded" />
				<Skeleton className="h-4 w-2/3 rounded" />
			</div>
			<div className="flex items-center justify-between">
				<Skeleton className="h-7 w-20 rounded-lg" />
				<Skeleton className="size-4 rounded" />
			</div>
		</div>
	);
}

export default function TodaysActivities() {
	const trpc = useTRPC();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [startingId, setStartingId] = useState<string | null>(null);

	const { data, isLoading } = useQuery(
		trpc.practice.getDailySuggestions.queryOptions(),
	);

	const regenerate = useMutation(
		trpc.practice.regenerateDailySuggestions.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.practice.getDailySuggestions.queryKey(),
				});
			},
		}),
	);

	const markDone = useMutation(
		trpc.practice.markActivityDone.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.practice.getDailySuggestions.queryKey(),
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
		if (data?.isStale && !regenerate.isPending && !regenerate.isSuccess) {
			regenerate.mutate();
		}
	}, [data?.isStale, regenerate.isPending, regenerate.isSuccess]);

	const activities = data?.activities ?? null;
	const isGenerating =
		isLoading || regenerate.isPending || (data?.isStale && !activities);
	const completedCount =
		activities?.filter((a) => a.completedAt !== null).length ?? 0;

	async function handleStart(activity: DailyActivity) {
		if (activity.completedAt || startingId) return;
		setStartingId(activity.id);

		try {
			if (activity.type === "pronunciation") {
				const result = await startPronunciation.mutateAsync({
					cefrLevel: activity.metadata.cefrLevel as
						| "A1"
						| "A2"
						| "B1"
						| "B2"
						| "C1"
						| undefined,
				});
				markDone.mutate({
					activityId: activity.id,
					sessionId: result.sessionId,
				});
				navigate({
					to: "/pronunciation/$sessionId",
					params: { sessionId: result.sessionId },
				});
			} else {
				const result = await startConversation.mutateAsync({
					scenario: activity.metadata.scenario ?? "small-talk",
					scenarioName: activity.metadata.scenarioName,
					scenarioDescription: activity.metadata.scenarioDescription,
					aiRole: activity.metadata.aiRole,
				});
				markDone.mutate({
					activityId: activity.id,
					sessionId: result.sessionId,
				});
				navigate({
					to: "/conversation/$sessionId",
					params: { sessionId: result.sessionId },
				});
			}
		} finally {
			setStartingId(null);
		}
	}

	return (
		<div
			className="relative overflow-hidden rounded-3xl bg-white p-2.5"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<div className="mt-1 mb-3 flex items-center justify-between gap-2 pr-2 pl-2 font-medium">
				<div className="flex w-full items-center justify-between gap-2">
					<div className="flex w-full items-center justify-between gap-2">
						<h1 className="font-bold font-lyon text-xl">Today's Practice</h1>
						{activities && activities.length > 0 && (
							<div className="font-normal text-muted-foreground text-sm">
								{completedCount}/{activities.length} done
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{isGenerating
					? ["s1", "s2", "s3", "s4", "s5", "s6"].map((key) => (
							<ActivitySkeleton key={key} />
						))
					: activities?.map((activity) => {
							const isDone = activity.completedAt !== null;
							const isStarting = startingId === activity.id;

							return (
								<button
									key={activity.id}
									type="button"
									disabled={isDone || isStarting}
									onClick={() => handleStart(activity)}
									className={cn(
										"group relative flex min-h-48 flex-col justify-between overflow-hidden rounded-2xl border p-4 text-left transition-all",
										isDone
											? "border-lime-200 bg-lime-50/50"
											: "hover:-translate-y-0.5 cursor-pointer border-border/50 bg-white hover:bg-neutral-50",
										isStarting && "pointer-events-none opacity-70",
									)}
								>
									{isDone && (
										<div className="absolute top-4 right-4 flex size-6 items-center justify-center rounded-full bg-lime-500">
											<CheckIcon
												className="size-3.5 text-white"
												strokeWidth={3}
											/>
										</div>
									)}

									<div>
										<Badge
											variant="outline"
											className={cn(
												"mb-4 rounded-lg px-2 py-0.5 font-normal text-xs italic",
												isDone
													? "border-lime-200 bg-lime-50 text-lime-700"
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
												isDone && "text-lime-900",
											)}
										>
											{activity.title}
										</h3>
									</div>
									<div className="mt-3 flex items-center justify-between">
										<span
											className={cn(
												"group flex items-center gap-1 whitespace-nowrap rounded-xl border px-2.5 py-1.5 font-medium text-neutral-700 text-xs italic shadow-none transition duration-150 ease-in-out will-change-transform focus:shadow-none focus:outline-none focus-visible:shadow-none",
												isDone
													? "border-lime-200 bg-lime-50 text-lime-700"
													: "border-neutral-200 hover:brightness-95",
											)}
										>
											{activity.typeLabel}
										</span>
										{/* {isStarting ? (
											<LoaderIcon className="size-4 animate-spin text-muted-foreground" />
										) : isDone ? (
											<span className="font-medium text-lime-600 text-xs">
												Completed
											</span>
										) : (
											<ArrowRightIcon
												className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
												strokeWidth={2}
											/>
										)} */}
										{isStarting ? (
											<LoaderIcon className="size-4 animate-spin text-muted-foreground" />
										) : isDone ? (
											<></>
										) : (
											<ArrowRightIcon
												className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
												strokeWidth={2}
											/>
										)}
									</div>
								</button>
							);
						})}
			</div>
		</div>
	);
}
