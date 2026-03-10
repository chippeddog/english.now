import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Mic, Sparkles } from "lucide-react";
import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";
import { Button } from "../ui/button";
import PracticeSession, { type FlashcardItem } from "./practice-session";

type VocabularyActivity = {
	id: string;
	title: string;
	description: string;
	duration: number;
	type: "vocabulary";
	typeLabel: string;
	completedAt: string | null;
	sessionId: string | null;
	payload: {
		cards: FlashcardItem[];
		focus: Array<"words" | "phrases">;
	};
};

export default function Practice() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const { data: planData, isLoading } = useQuery(
		trpc.practice.getTodayPlan.queryOptions(),
	);
	const ensurePlan = useMutation(
		trpc.practice.ensureTodayPlan.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.practice.getTodayPlan.queryKey(),
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

	const [setupOpen, setSetupOpen] = useState(false);
	const [selectedActivity, setSelectedActivity] =
		useState<VocabularyActivity | null>(null);
	const [sessionActivity, setSessionActivity] =
		useState<VocabularyActivity | null>(null);
	const [sessionKey, setSessionKey] = useState(0);

	const handleStart = () => {
		if (!selectedActivity) return;

		if (!selectedActivity.completedAt && !selectedActivity.sessionId) {
			startActivity.mutate({
				activityId: selectedActivity.id,
				sessionId: `vocabulary:${selectedActivity.id}`,
			});
		}

		setSetupOpen(false);
		setSessionActivity(selectedActivity);
		setSessionKey((key) => key + 1);
	};

	const handleSessionClose = () => {
		setSessionActivity(null);
	};

	const handleRestart = () => {
		if (!sessionActivity) return;
		setSessionActivity(null);
		requestAnimationFrame(() => {
			setSessionActivity(sessionActivity);
			setSessionKey((key) => key + 1);
		});
	};

	const vocabularyActivities = (
		(planData?.activities ?? []) as Array<VocabularyActivity | { type: string }>
	).filter(
		(activity): activity is VocabularyActivity =>
			activity.type === "vocabulary",
	);
	const canStart = Boolean(selectedActivity);

	return (
		<>
			<Dialog open={setupOpen} onOpenChange={setSetupOpen}>
				<DialogTrigger asChild>
					<Button
						type="button"
						variant="outline"
						className="group flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-xl border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)] px-2.5 py-1.5 font-medium text-lime-900 text-sm italic shadow-none transition duration-150 ease-in-out will-change-transform hover:bg-lime-700/10 hover:brightness-95 focus:shadow-none focus:outline-none focus-visible:shadow-none"
					>
						<Mic className="size-4" />
						Practice
					</Button>
				</DialogTrigger>

				<DialogContent>
					<DialogHeader>
						<DialogTitle className="font-bold font-lyon text-2xl tracking-tight">
							Quick Practice
						</DialogTitle>
						<DialogDescription className="text-neutral-500">
							Choose from today&apos;s prepared vocabulary sets
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 pb-2">
						{isLoading ||
						planData?.status === "missing" ||
						planData?.status === "queued" ||
						planData?.status === "generating" ? (
							<div className="rounded-xl border border-neutral-200 border-dashed bg-neutral-50 p-4 text-center text-muted-foreground text-sm">
								We&apos;re preparing today&apos;s vocabulary sets.
							</div>
						) : vocabularyActivities.length === 0 ? (
							<div className="rounded-xl border border-neutral-200 border-dashed bg-neutral-50 p-4 text-center text-muted-foreground text-sm">
								{planData?.error ?? "No vocabulary set is ready yet."}
								<div className="mt-3">
									<Button
										type="button"
										variant="outline"
										className="rounded-xl"
										disabled={ensurePlan.isPending}
										onClick={() => ensurePlan.mutate()}
									>
										{ensurePlan.isPending
											? "Preparing..."
											: "Prepare today’s plan"}
									</Button>
								</div>
							</div>
						) : (
							vocabularyActivities.map((activity) => (
								<button
									key={activity.id}
									type="button"
									onClick={() => setSelectedActivity(activity)}
									className={cn(
										"flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3 text-left transition-all",
										selectedActivity?.id === activity.id
											? "border-lime-400 bg-lime-50"
											: "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50",
									)}
								>
									<div className="flex size-9 items-center justify-center rounded-xl bg-lime-100 text-lime-700">
										{activity.payload.focus.includes("words") &&
										activity.payload.focus.includes("phrases") ? (
											<Mic className="size-4" />
										) : activity.payload.focus.includes("words") ? (
											<BookOpen className="size-4" />
										) : (
											<Sparkles className="size-4" />
										)}
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex items-center justify-between gap-2">
											<span className="font-medium text-neutral-900 text-sm">
												{activity.title}
											</span>
											<span className="shrink-0 text-neutral-400 text-xs">
												{activity.payload.cards.length} cards
											</span>
										</div>
										<p className="mt-1 text-muted-foreground text-sm">
											{activity.description}
										</p>
									</div>
								</button>
							))
						)}
					</div>

					<DialogFooter>
						<Button
							variant="ghost"
							className="flex-1 sm:flex-none"
							onClick={() => setSetupOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleStart}
							disabled={!canStart}
							className="flex-1 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 sm:flex-none"
						>
							Start Practice
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{sessionActivity && (
				<PracticeSession
					key={sessionKey}
					cards={sessionActivity.payload.cards}
					onClose={handleSessionClose}
					onRestart={handleRestart}
					onComplete={() => {
						markDone.mutate({
							activityId: sessionActivity.id,
							sessionId: `vocabulary:${sessionActivity.id}`,
						});
					}}
				/>
			)}
		</>
	);
}
