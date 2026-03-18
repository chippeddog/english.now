import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader, MicIcon, RefreshCwIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
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

type ParagraphPreview = {
	text: string;
	topic: string;
	cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1";
	wordCount: number;
	focusAreas: string[];
	tips: string;
};

type PronunciationActivity = {
	id: string;
	title: string;
	description: string;
	type: "pronunciation";
	typeLabel: string;
	startedAt: string | null;
	completedAt: string | null;
	sessionId: string | null;
	payload: {
		paragraph: ParagraphPreview;
	};
};

function SkeletonText() {
	return (
		<div className="flex flex-col gap-2 pt-3">
			<div className="h-3.5 w-full animate-pulse rounded bg-neutral-100" />
			<div className="h-3.5 w-full animate-pulse rounded bg-neutral-100" />
			<div className="h-3.5 w-[90%] animate-pulse rounded bg-neutral-100" />
			<div className="h-3.5 w-[75%] animate-pulse rounded bg-neutral-100" />
			<div className="h-3.5 w-full animate-pulse rounded bg-neutral-100" />
			<div className="h-3.5 w-[90%] animate-pulse rounded bg-neutral-100" />
		</div>
	);
}

function DialogTopicsPronunciation({
	open,
	setOpen,
	onUpgradeClick,
}: {
	open: boolean;
	setOpen: (open: boolean) => void;
	onUpgradeClick: () => void;
}) {
	const trpc = useTRPC();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { t } = useTranslation("app");
	const [selectedId, setSelectedId] = useState<string | null>(null);

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

	const activities = (
		(planData?.activities ?? []) as Array<
			PronunciationActivity | { type: string }
		>
	).filter(
		(activity): activity is PronunciationActivity =>
			activity.type === "pronunciation",
	);

	useEffect(() => {
		if (
			open &&
			(planData?.status === "missing" || planData?.status === "failed") &&
			!ensurePlan.isPending
		) {
			ensurePlan.mutate();
		}
	}, [open, planData?.status, ensurePlan.isPending]);

	useEffect(() => {
		if (activities.length === 0) {
			if (selectedId) {
				setSelectedId(null);
			}
			return;
		}

		if (
			!selectedId ||
			!activities.some((activity) => activity.id === selectedId)
		) {
			setSelectedId(activities[0]?.id ?? null);
		}
	}, [selectedId, activities]);

	const selectedActivity =
		activities.find((activity) => activity.id === selectedId) ??
		activities[0] ??
		null;
	const preview = selectedActivity?.payload.paragraph ?? null;
	const access = planData?.access ?? null;

	const startSession = useMutation(
		trpc.pronunciation.startSession.mutationOptions({
			onSuccess: (data) => {
				queryClient.invalidateQueries({
					queryKey: trpc.practice.getTodayPlan.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.practice.getHomeTodayPlan.queryKey(),
				});
				navigate({
					to: "/pronunciation/$sessionId",
					params: { sessionId: data.sessionId },
				});
			},
		}),
	);

	const handleStart = async () => {
		if (!selectedActivity) return;

		const gateState = getActivityGateState(access, selectedActivity);

		if (gateState === "locked") {
			onUpgradeClick();
			return;
		}

		if (gateState === "resume" && selectedActivity.sessionId) {
			setOpen(false);
			navigate({
				to: "/pronunciation/$sessionId",
				params: { sessionId: selectedActivity.sessionId },
			});
			return;
		}

		try {
			await startSession.mutateAsync({ activityId: selectedActivity.id });
		} catch (error) {
			if (isFreePracticeLimitError(error)) {
				onUpgradeClick();
				return;
			}

			throw error;
		}
	};

	const handleEnsurePlan = () => {
		if (!ensurePlan.isPending) {
			ensurePlan.mutate();
		}
	};

	const handleNextPreview = () => {
		if (activities.length > 1) {
			const currentIndex = activities.findIndex(
				(activity) => activity.id === selectedActivity?.id,
			);
			const nextActivity =
				activities[(currentIndex + 1 + activities.length) % activities.length];

			if (nextActivity) {
				setSelectedId(nextActivity.id);
				return;
			}
		}

		handleEnsurePlan();
	};

	const isGenerating =
		isPlanLoading ||
		ensurePlan.isPending ||
		planData?.status === "missing" ||
		planData?.status === "queued" ||
		planData?.status === "generating";
	const previewKey =
		selectedActivity?.id ??
		preview?.text ??
		(isGenerating ? "loading" : "empty");

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent showCloseButton={false}>
				<div className="mb-8 flex flex-col gap-3 text-center">
					<h1 className="font-bold font-lyon text-3xl tracking-tight">
						{t("practice.pronunciation")}
					</h1>
					<p className="text-md text-muted-foreground">
						{t("practice.practiceYourPronunciationDescription")}
					</p>
				</div>
				<div className="relative">
					<div className="-top-4.5 absolute right-0 left-0 mx-auto h-[200px] w-[80%] rounded-t-2xl bg-white shadow ring-1 ring-black/5" />
					<div className="-top-2 absolute right-0 left-0 mx-auto h-[200px] w-[87%] rounded-t-2xl bg-white shadow ring-1 ring-black/5" />
					<div className="relative z-10 overflow-hidden border-neutral-200 border-b border-dashed p-4 pt-0.5 pb-0">
						<AnimatePresence initial={false} mode="popLayout">
							<motion.div
								key={previewKey}
								initial={{ x: 36, rotate: 2, opacity: 0, scale: 0.98 }}
								animate={{ x: 0, rotate: 0, opacity: 1, scale: 1 }}
								exit={{ x: -36, rotate: -2, opacity: 0, scale: 0.97 }}
								transition={{
									type: "spring",
									stiffness: 280,
									damping: 26,
									mass: 0.9,
								}}
								className="relative min-h-48 rounded-t-2xl border-neutral-200 border-b-0 bg-white p-4 shadow"
								style={{
									boxShadow:
										"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
								}}
							>
								<button
									type="button"
									onClick={handleNextPreview}
									disabled={isGenerating}
									aria-label={
										activities.length > 1
											? "Show next pronunciation text"
											: "Generate another pronunciation text"
									}
									className="absolute top-4 right-4 z-10 flex size-6 shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-lg bg-linear-to-t from-[#202020] to-[#2F2F2F] font-base text-white shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none backdrop-blur transition-all hover:opacity-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:from-[rgb(192,192,192)] dark:to-[rgb(255,255,255)] dark:shadow-[inset_0_1px_4px_0_rgba(128,128,128,0.2)] dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none"
								>
									<RefreshCwIcon
										className={cn("size-3.5", isGenerating && "animate-spin")}
									/>
								</button>
								<div className="pt-1">
									<h3 className="font-semibold text-sm italic">Read Aloud</h3>
									{isGenerating && !preview ? (
										<SkeletonText />
									) : preview ? (
										<div className={cn("pt-4", isGenerating && "opacity-50")}>
											<p className="text-sm leading-relaxed">{preview.text}</p>
											<div className="mt-3 flex items-center gap-2">
												{/* <span className="rounded-md bg-lime-100 px-1.5 py-0.5 font-medium text-lime-700 text-xs"> */}
												<span className="rounded-md bg-radial from-[#EFFF9B] to-[#D8FF76] px-1.5 py-0.5 font-medium text-lime-900 text-xs normal-case tracking-normal md:py-[0.165rem] md:text-xs">
													{preview.cefrLevel}
												</span>
												<span className="text-muted-foreground text-xs">
													{preview.topic}
												</span>
											</div>
										</div>
									) : (
										<p className="pt-3 text-muted-foreground text-sm">
											{planData?.error ??
												"We’re still preparing your pronunciation activities."}
										</p>
									)}
								</div>
							</motion.div>
						</AnimatePresence>
					</div>
				</div>
				<DialogFooter>
					<DialogClose asChild>
						<Button
							variant="ghost"
							className="flex-1 rounded-xl italic sm:flex-none"
						>
							{t("practice.cancel")}
						</Button>
					</DialogClose>
					<Button
						onClick={handleStart}
						disabled={!preview || isGenerating || startSession.isPending}
						className="relative flex shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-xl bg-linear-to-t from-[#202020] to-[#2F2F2F] font-base text-white italic shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none backdrop-blur transition-all hover:opacity-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:from-[rgb(192,192,192)] dark:to-[rgb(255,255,255)] dark:shadow-[inset_0_1px_4px_0_rgba(128,128,128,0.2)] dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none"
					>
						{startSession.isPending && (
							<Loader className="size-4 animate-spin" />
						)}
						{selectedActivity &&
						getActivityGateState(access, selectedActivity) === "resume"
							? "Resume Practice"
							: "Start Practice"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function Pronunciation() {
	const { t } = useTranslation("app");
	const [dialogOpen, setDialogOpen] = useState(false);
	const navigate = useNavigate();
	const trpc = useTRPC();
	const { openDialog: openUpgradeDialog } = useUpgradeDialog();
	const { data: planData } = useQuery(
		trpc.practice.getTodayPlan.queryOptions(),
	);
	const gateState = getPracticeTypeGateState(
		planData?.access ?? null,
		"pronunciation",
	);
	const resumeSessionId =
		gateState === "resume" &&
		planData?.access?.usedPracticeType === "pronunciation"
			? planData.access.usedPracticeSessionId
			: null;

	const handleCardClick = () => {
		if (gateState === "locked") {
			openUpgradeDialog();
			return;
		}

		if (gateState === "resume" && resumeSessionId) {
			navigate({
				to: "/pronunciation/$sessionId",
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
			<DialogTopicsPronunciation
				open={dialogOpen}
				setOpen={setDialogOpen}
				onUpgradeClick={openUpgradeDialog}
			/>
			<button
				onClick={handleCardClick}
				type="button"
				className="group flex w-full cursor-pointer items-center justify-between p-3.5 transition-colors duration-300 hover:bg-neutral-100"
			>
				<div className="flex items-center gap-2.5">
					<div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#C6F64D] bg-radial from-[#EFFF9B] to-[#D8FF76]">
						<MicIcon className="size-5 text-lime-700" />
					</div>
					<div className="text-left">
						<h2 className="font-medium text-slate-900">
							{t("practice.pronunciation")}
						</h2>
						<p className="text-muted-foreground text-sm">
							{t("practice.practiceYourPronunciation")}
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
	);
}
