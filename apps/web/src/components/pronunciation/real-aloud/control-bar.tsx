import {
	AudioLines,
	CornerDownRight,
	Loader,
	Pause,
	Play,
	RotateCw,
	Square,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const GAUGE_SIZE = 48;
const GAUGE_STROKE = 4;
const GAUGE_RADIUS = GAUGE_SIZE / 2 - GAUGE_STROKE;
const GAUGE_CENTER = GAUGE_SIZE / 2;
const GAUGE_START_ANGLE = 225;
const GAUGE_SWEEP_ANGLE = 270;
const GAUGE_SEGMENT_GAP = 20;
const GAUGE_TRACK_PATH = describeGaugeArc(
	GAUGE_START_ANGLE,
	GAUGE_START_ANGLE + GAUGE_SWEEP_ANGLE,
);

function polarToCartesian(angle: number) {
	const radians = ((angle - 90) * Math.PI) / 180;

	return {
		x: GAUGE_CENTER + GAUGE_RADIUS * Math.cos(radians),
		y: GAUGE_CENTER + GAUGE_RADIUS * Math.sin(radians),
	};
}

function describeGaugeArc(startAngle: number, endAngle: number) {
	const start = polarToCartesian(startAngle);
	const end = polarToCartesian(endAngle);
	const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

	return [
		`M ${start.x} ${start.y}`,
		`A ${GAUGE_RADIUS} ${GAUGE_RADIUS} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
	].join(" ");
}

function getGaugeSegments(segmentCount: number) {
	if (segmentCount <= 1) {
		return [GAUGE_TRACK_PATH];
	}

	const totalGap = GAUGE_SEGMENT_GAP * (segmentCount - 1);
	const segmentSweep = (GAUGE_SWEEP_ANGLE - totalGap) / segmentCount;

	return Array.from({ length: segmentCount }, (_, index) => {
		const startAngle =
			GAUGE_START_ANGLE + index * (segmentSweep + GAUGE_SEGMENT_GAP);
		const endAngle = startAngle + segmentSweep;
		return describeGaugeArc(startAngle, endAngle);
	});
}

function AttemptQuotaRing({
	isPro,
	used,
	limit,
	remaining,
}: {
	isPro: boolean;
	used: number;
	limit: number;
	remaining: number | null;
}) {
	const { t } = useTranslation("app");
	const rem = remaining ?? Math.max(0, limit - used);
	const activeSegments = Math.min(limit, Math.max(0, used));
	const segments = getGaugeSegments(limit);
	const activeStrokeClass =
		activeSegments >= limit
			? "stroke-red-500"
			: activeSegments >= 2
				? "stroke-amber-500"
				: activeSegments >= 1
					? "stroke-green-500"
					: "stroke-muted-foreground/30";
	const valueTextClass =
		activeSegments >= limit
			? "text-red-500"
			: activeSegments >= 2
				? "text-amber-500"
				: activeSegments >= 1
					? "text-green-500"
					: "text-foreground";

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					aria-label={t("pronunciation.session.attemptQuota.ariaLabel", {
						used,
						limit,
						remaining: rem,
					})}
				>
					<svg
						width={GAUGE_SIZE}
						height={GAUGE_SIZE}
						viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}
						className="pointer-events-none"
						aria-hidden
					>
						<title>Attempt quota gauge</title>
						{segments.map((segmentPath) => (
							<path
								key={`track-${segmentPath}`}
								d={segmentPath}
								fill="none"
								className="stroke-muted-foreground/20"
								strokeWidth={GAUGE_STROKE}
								strokeLinecap="round"
							/>
						))}
						{segments.map((segmentPath, index) =>
							index < activeSegments ? (
								<path
									key={`active-${segmentPath}`}
									d={segmentPath}
									fill="none"
									className={cn(
										activeStrokeClass,
										"transition-colors duration-300 ease-out",
									)}
									strokeWidth={GAUGE_STROKE}
									strokeLinecap="round"
								/>
							) : null,
						)}
					</svg>
					<span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
						<span className={cn(valueTextClass, "font-semibold text-xs")}>
							{used}
						</span>
					</span>
				</button>
			</TooltipTrigger>
			<TooltipContent
				side="top"
				sideOffset={8}
				className="max-w-[240px] text-left"
			>
				<div className="space-y-1">
					<p className="font-medium">
						{t("pronunciation.session.attemptQuota.used", {
							count: limit,
							used,
							limit,
						})}
					</p>
					<p className="text-[11px] text-background/85 leading-snug">
						{t("pronunciation.session.attemptQuota.left", {
							count: rem,
							suffix: isPro
								? t("pronunciation.session.attemptQuota.proSuffix")
								: t("pronunciation.session.attemptQuota.freeSuffix"),
						})}
					</p>
				</div>
			</TooltipContent>
		</Tooltip>
	);
}

function SessionAttemptCountRing({ count }: { count: number }) {
	const { t } = useTranslation("app");

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					className="relative inline-flex size-12 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					aria-label={t("pronunciation.session.attemptCount.ariaLabel", {
						count,
					})}
				>
					<svg
						width={GAUGE_SIZE}
						height={GAUGE_SIZE}
						viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}
						className="pointer-events-none"
						aria-hidden
					>
						<title>Session attempt count gauge</title>
						<path
							d={GAUGE_TRACK_PATH}
							fill="none"
							className="stroke-muted-foreground/15"
							strokeWidth={GAUGE_STROKE}
							strokeLinecap="round"
						/>
					</svg>
					<span className="pointer-events-none absolute inset-0 flex items-center justify-center">
						<span className="font-semibold text-foreground text-sm tabular-nums leading-none">
							{count}
						</span>
					</span>
				</button>
			</TooltipTrigger>
			<TooltipContent
				side="top"
				sideOffset={8}
				className="max-w-[220px] text-left"
			>
				<p className="font-medium">
					{t("pronunciation.session.attemptCount.tooltip", { count })}
				</p>
			</TooltipContent>
		</Tooltip>
	);
}

export type ReadAloudControlBarProps = {
	attemptAccess?: {
		isPro: boolean;
		used: number;
		limit: number | null;
		remaining: number | null;
		reachedLimit: boolean;
	};
	attemptCount: number;
	hasRecordingSession: boolean;
	isPaused: boolean;
	isRecording: boolean;
	isSaving: boolean;
	submitPending: boolean;
	isFinishing: boolean;
	onPauseToggle: () => void;
	onCancelRecording: () => void;
	onRecord: () => void;
	isRecordDisabled: boolean;
	recordTooltipLabel: string;
	showFinish: boolean;
	onFinish: () => void;
};

export default function ControlBar(props: ReadAloudControlBarProps) {
	const { t } = useTranslation("app");
	const {
		attemptAccess,
		attemptCount,
		hasRecordingSession,
		isPaused,
		isRecording,
		isSaving,
		submitPending,
		isFinishing,
		onPauseToggle,
		onCancelRecording,
		onRecord,
		isRecordDisabled,
		recordTooltipLabel,
		showFinish,
		onFinish,
	} = props;

	const controlsBusy = isSaving || submitPending || isFinishing;

	return (
		<div
			className={cn(
				"fixed inset-x-0 bottom-0 z-20",
				"border-border/50 border-t bg-background/95 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur supports-backdrop-filter:bg-background/80",
			)}
		>
			<div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4">
				<div className="flex min-w-0 flex-1 items-center">
					{attemptAccess && attemptAccess.limit != null ? (
						<AttemptQuotaRing
							isPro={attemptAccess.isPro}
							used={attemptAccess.used}
							limit={attemptAccess.limit}
							remaining={attemptAccess.remaining}
						/>
					) : attemptCount > 0 ? (
						<SessionAttemptCountRing count={attemptCount} />
					) : null}
				</div>
				<div className="flex shrink-0 items-center justify-end gap-2">
					{hasRecordingSession && (
						<>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										className="rounded-xl"
										size="icon"
										onClick={onPauseToggle}
										disabled={controlsBusy}
									>
										{isPaused ? (
											<Play className="size-4" />
										) : (
											<Pause className="size-4" />
										)}
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{isPaused
										? t("pronunciation.session.controls.continueRecording")
										: t("pronunciation.session.controls.pauseRecording")}
								</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="rounded-xl"
										onClick={onCancelRecording}
										disabled={controlsBusy}
									>
										<RotateCw className="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{t("pronunciation.session.controls.clearAndStartAgain")}
								</TooltipContent>
							</Tooltip>
						</>
					)}
					<Tooltip>
						<TooltipTrigger asChild>
							<span className="inline-flex">
								<Button
									size="lg"
									variant={hasRecordingSession ? "destructive" : "default"}
									onClick={onRecord}
									disabled={isRecordDisabled}
									className={cn(
										"relative flex cursor-pointer gap-1.5 overflow-hidden whitespace-nowrap rounded-xl bg-linear-to-t from-[#202020] to-[#2F2F2F] font-base text-white italic shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none backdrop-blur transition-all hover:opacity-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none",
										isRecording && "animate-pulse",
									)}
								>
									{isSaving || submitPending ? (
										<Loader className="size-4 animate-spin" />
									) : hasRecordingSession ? (
										<Square className="size-4" fill="currentColor" />
									) : (
										<AudioLines className="size-4" />
									)}
									{isSaving || submitPending
										? t("pronunciation.session.controls.saving")
										: isPaused
											? t("pronunciation.session.controls.saveRecording")
											: isRecording
												? t("pronunciation.session.stopRecording")
												: t("pronunciation.session.controls.record")}
								</Button>
							</span>
						</TooltipTrigger>
						<TooltipContent>{recordTooltipLabel}</TooltipContent>
					</Tooltip>
					{showFinish && (
						<>
							<Separator
								orientation="vertical"
								className="relative z-10 mx-2 h-6! w-px bg-border/50"
							/>
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										size="icon"
										type="button"
										disabled={isFinishing}
										className="flex size-10 cursor-pointer items-center whitespace-nowrap rounded-xl border border-[#C6F64D] bg-radial from-[#EFFF9B] to-[#D8FF76] px-2.5 py-1.5 font-medium text-lime-700 text-sm italic shadow-none transition duration-150 ease-in-out will-change-transform hover:bg-lime-700/10 hover:brightness-95 focus:shadow-none focus:outline-none focus-visible:shadow-none"
									>
										<CornerDownRight className="size-4" />
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent className="w-sm">
									<AlertDialogHeader>
										<AlertDialogTitle>
											{t("pronunciation.session.controls.finishReviewTitle")}
										</AlertDialogTitle>
										<AlertDialogDescription>
											{t(
												"pronunciation.session.controls.finishReviewDescription",
											)}
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel
											className="flex-1 rounded-xl italic sm:flex-none"
											variant="ghost"
										>
											{t("practice.cancel")}
										</AlertDialogCancel>
										<AlertDialogAction
											onClick={onFinish}
											disabled={isFinishing}
											className="relative flex shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-xl bg-linear-to-t from-[#202020] to-[#2F2F2F] font-base text-white italic shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none backdrop-blur transition-all hover:opacity-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:from-[rgb(192,192,192)] dark:to-[rgb(255,255,255)] dark:shadow-[inset_0_1px_4px_0_rgba(128,128,128,0.2)] dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none"
										>
											{t("pronunciation.session.controls.finish")}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
