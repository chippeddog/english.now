import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, MessageCircleIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUpgradeDialog } from "@/components/dashboard/upgrade-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	getActivityGateState,
	getPracticeTypeGateState,
	isFreePracticeLimitError,
} from "@/lib/feature-gating";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

type ConversationActivity = {
	id: string;
	title: string;
	emoji: string;
	description: string;
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

function SkeletonCard() {
	return (
		<div className="flex h-12 animate-pulse items-center justify-center gap-2 rounded-xl border border-transparent bg-neutral-100" />
	);
}

function DialogTopics({
	open,
	setOpen,
	onUpgradeClick,
}: {
	open: boolean;
	setOpen: (open: boolean) => void;
	onUpgradeClick: () => void;
}) {
	const navigate = useNavigate();
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const [selectedScenario, setSelectedScenario] = useState<string>("");
	const [selectedActivity, setSelectedActivity] =
		useState<ConversationActivity | null>(null);

	const { data: planData, isLoading: isPlanLoading } = useQuery({
		...trpc.practice.getTodayPlan.queryOptions(),
		enabled: open,
	});

	const ensurePlan = useMutation(
		trpc.practice.ensureTodayPlan.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.practice.getTodayPlan.queryKey(),
				});
			},
		}),
	);

	const startConversation = useMutation(
		trpc.conversation.start.mutationOptions({
			onSuccess: (data) => {
				queryClient.invalidateQueries({
					queryKey: trpc.practice.getTodayPlan.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.practice.getHomeTodayPlan.queryKey(),
				});

				setOpen(false);
				navigate({
					to: "/conversation/$sessionId",
					params: { sessionId: data.sessionId },
				});
			},
		}),
	);

	const conversationActivities = (
		(planData?.activities ?? []) as Array<
			ConversationActivity | { type: string }
		>
	).filter(
		(activity): activity is ConversationActivity =>
			activity.type === "conversation",
	);

	const topics = conversationActivities.filter(
		(activity) => activity.payload.scenarioType === "topic",
	);
	const roleplays = conversationActivities.filter(
		(activity) => activity.payload.scenarioType === "roleplay",
	);
	const hasContent = topics.length > 0 || roleplays.length > 0;
	const access = planData?.access ?? null;
	const isGenerating =
		isPlanLoading ||
		ensurePlan.isPending ||
		planData?.status === "missing" ||
		planData?.status === "queued" ||
		planData?.status === "generating";

	// const handleEnsurePlan = () => {
	// 	if (!ensurePlan.isPending) {
	// 		ensurePlan.mutate();
	// 	}
	// };

	const handleStartConversation = async () => {
		if (!selectedActivity) return;

		const gateState = getActivityGateState(access, selectedActivity);

		if (gateState === "locked") {
			onUpgradeClick();
			return;
		}

		if (gateState === "resume" && selectedActivity.sessionId) {
			setOpen(false);
			navigate({
				to: "/conversation/$sessionId",
				params: { sessionId: selectedActivity.sessionId },
			});
			return;
		}

		try {
			await startConversation.mutateAsync({
				activityId: selectedActivity.id,
			});
		} catch (error) {
			if (isFreePracticeLimitError(error)) {
				onUpgradeClick();
				return;
			}

			throw error;
		}
	};

	const handleSelectTopic = (activity: ConversationActivity) => {
		if (getActivityGateState(access, activity) === "locked") {
			onUpgradeClick();
			return;
		}

		setSelectedScenario(activity.id);
		setSelectedActivity(activity);
	};

	const handleSelectRoleplay = (activity: ConversationActivity) => {
		if (getActivityGateState(access, activity) === "locked") {
			onUpgradeClick();
			return;
		}

		setSelectedScenario(activity.id);
		setSelectedActivity(activity);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent showCloseButton={false}>
				<div className="mb-3 flex flex-col gap-2 text-center">
					<h1 className="font-bold font-lyon text-3xl tracking-tight">
						What would you like to talk about?
					</h1>
					<p className="text-muted-foreground text-sm">
						Pre-generated daily topics and roleplays for today
					</p>
				</div>

				<div className="flex items-center justify-between">
					<h2 className="font-semibold text-sm italic">Topics</h2>
					{/* <button
						type="button"
						onClick={handleEnsurePlan}
						disabled={ensurePlan.isPending}
						className="relative flex size-6 shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-lg bg-linear-to-t from-[#202020] to-[#2F2F2F] font-base text-white shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none backdrop-blur transition-all hover:opacity-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:from-[rgb(192,192,192)] dark:to-[rgb(255,255,255)] dark:shadow-[inset_0_1px_4px_0_rgba(128,128,128,0.2)] dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none"
					>
						<PlusIcon className="size-4" />
					</button> */}
				</div>
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
					{isGenerating && !hasContent ? (
						<>
							<SkeletonCard />
							<SkeletonCard />
							<SkeletonCard />
							<SkeletonCard />
							<SkeletonCard />
							<SkeletonCard />
						</>
					) : !hasContent ? (
						<p className="col-span-full text-center text-muted-foreground text-sm">
							{planData?.error ??
								"Your conversation activities are being prepared."}
						</p>
					) : (
						topics.map((topic) =>
							(() => {
								const gateState = getActivityGateState(access, topic);
								const isLocked = gateState === "locked";
								// const isResume = gateState === "resume";
								return (
									<button
										key={topic.id}
										type="button"
										onClick={() => handleSelectTopic(topic)}
										className={cn(
											"flex items-center justify-center gap-2 rounded-xl border bg-neutral-50 p-2.5 px-2 text-center transition-all",
											isLocked
												? "border-transparent text-muted-foreground opacity-50"
												: "hover:border-border/50 hover:bg-neutral-100",
											selectedScenario === topic.id && !isLocked
												? "border-lime-500 bg-lime-100 hover:border-lime-500 hover:bg-lime-100"
												: !isLocked && "border-transparent bg-neutral-50",
										)}
									>
										<span className="sm:text-xl">{topic.emoji}</span>
										<span className="font-medium text-xs sm:text-sm">
											{topic.title}
										</span>
									</button>
								);
							})(),
						)
					)}
				</div>
				<hr className="my-1.5 border-neutral-200 border-dashed" />
				<div className="flex items-center justify-between">
					<h2 className="font-semibold text-sm italic">Role-plays</h2>
					{/* <button
						type="button"
						onClick={handleEnsurePlan}
						disabled={ensurePlan.isPending}
						className="relative flex size-6 shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-lg bg-linear-to-t from-[#202020] to-[#2F2F2F] font-base text-white shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none backdrop-blur transition-all hover:opacity-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:from-[rgb(192,192,192)] dark:to-[rgb(255,255,255)] dark:shadow-[inset_0_1px_4px_0_rgba(128,128,128,0.2)] dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none"
					>
						<PlusIcon className="size-4" />
					</button> */}
				</div>
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
					{isGenerating && !hasContent ? (
						<>
							<SkeletonCard />
							<SkeletonCard />
							<SkeletonCard />
							<SkeletonCard />
						</>
					) : roleplays.length === 0 ? (
						<p className="col-span-full text-center text-muted-foreground text-sm">
							No roleplays available yet.
						</p>
					) : (
						roleplays.map((roleplay) =>
							(() => {
								const gateState = getActivityGateState(access, roleplay);
								const isLocked = gateState === "locked";
								const isResume = gateState === "resume";

								return (
									<button
										key={roleplay.id}
										type="button"
										onClick={() => handleSelectRoleplay(roleplay)}
										className={cn(
											"flex items-center justify-center gap-2 rounded-xl border bg-neutral-50 p-2.5 px-2 text-center transition-all",
											isLocked
												? "border-transparent text-muted-foreground opacity-50"
												: "hover:border-border/50 hover:bg-neutral-100",
											selectedScenario === roleplay.id && !isLocked
												? "border-lime-500 bg-lime-100 hover:border-lime-500 hover:bg-lime-100"
												: !isLocked && "border-transparent bg-neutral-50",
										)}
									>
										<span className="sm:text-xl">{roleplay.emoji}</span>
										<span className="font-medium text-xs sm:text-sm">
											{roleplay.title}
										</span>
									</button>
								);
							})(),
						)
					)}
				</div>

				<DialogFooter className="mt-3">
					<DialogClose asChild>
						<Button
							variant="ghost"
							className="flex-1 rounded-xl italic sm:flex-none"
						>
							Cancel
						</Button>
					</DialogClose>
					<Button
						onClick={handleStartConversation}
						disabled={!selectedScenario || startConversation.isPending}
						className="relative flex shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-xl bg-linear-to-t from-[#202020] to-[#2F2F2F] font-base text-white italic shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none backdrop-blur transition-all hover:opacity-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:from-[rgb(192,192,192)] dark:to-[rgb(255,255,255)] dark:shadow-[inset_0_1px_4px_0_rgba(128,128,128,0.2)] dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none"
					>
						{startConversation.isPending && (
							<Loader2 className="size-5 animate-spin" />
						)}
						{selectedActivity &&
						getActivityGateState(access, selectedActivity) === "resume"
							? "Resume Conversation"
							: "Start Conversation"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function Conversation() {
	const [dialogOpen, setDialogOpen] = useState(false);
	const { t } = useTranslation("app");
	const navigate = useNavigate();
	const trpc = useTRPC();
	const { openDialog: openUpgradeDialog } = useUpgradeDialog();
	const { data: planData } = useQuery(
		trpc.practice.getTodayPlan.queryOptions(),
	);
	const gateState = getPracticeTypeGateState(
		planData?.access ?? null,
		"conversation",
	);
	const resumeSessionId =
		gateState === "resume" &&
		planData?.access?.usedPracticeType === "conversation"
			? planData.access.usedPracticeSessionId
			: null;

	const handleCardClick = () => {
		if (gateState === "locked") {
			openUpgradeDialog();
			return;
		}

		if (gateState === "resume" && resumeSessionId) {
			navigate({
				to: "/conversation/$sessionId",
				params: { sessionId: resumeSessionId },
			});
			return;
		}

		setDialogOpen(true);
	};

	return (
		<div
			className="overflow-hidden rounded-[1.2rem] bg-white"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<DialogTopics
				open={dialogOpen}
				setOpen={setDialogOpen}
				onUpgradeClick={openUpgradeDialog}
			/>
			<div className="p-0">
				<button
					type="button"
					onClick={handleCardClick}
					className="group flex w-full cursor-pointer items-center justify-between p-3.5 transition-colors duration-300 hover:bg-neutral-100"
				>
					<div className="flex items-center gap-3">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#C6F64D] bg-radial from-[#EFFF9B] to-[#D8FF76]">
							<MessageCircleIcon className="size-5 text-lime-700" />
						</div>
						<div className="text-left">
							<h2 className="font-medium text-slate-900">
								{t("practice.conversation")}
							</h2>
							<p className="text-muted-foreground text-sm">
								{t("practice.practiceYourEnglish")}
							</p>
						</div>
					</div>
					<svg
						className="relative size-5 text-gray-400 transition-all duration-300 group-hover:text-gray-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>
			</div>
		</div>
	);
}
