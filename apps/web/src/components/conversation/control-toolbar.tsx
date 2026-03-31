import {
	Circle,
	CornerDownRight,
	Lightbulb,
	Loader,
	LogOutIcon,
	Mic,
	MicOff,
	MousePointer2,
	MousePointerClick,
	SearchIcon,
	SquareArrowRight,
	SquareDashedMousePointer,
	TextSelect,
	Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ControlToolbarProps = {
	showHint: boolean;
	setShowHint: (show: boolean) => void;
	hasHint: boolean;
	fetchHintSuggestion: () => void;
	isLoading: boolean;
	recordingState: "idle" | "recording" | "transcribing";
	recordingDurationMs: number;
	maxRecordingDurationMs: number;
	startRecording: () => void;
	stopRecording: () => void;
	cancelRecording: () => void;
	setShowFinishDialog: (show: boolean) => void;
	isFinishing: boolean;
	vocabMode: "off" | "word" | "phrase";
	setVocabMode: (mode: "off" | "word" | "phrase") => void;
};

function formatDuration(durationMs: number) {
	const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function ControlToolbar({
	showHint,
	setShowHint,
	hasHint,
	fetchHintSuggestion,
	isLoading,
	recordingState,
	recordingDurationMs,
	maxRecordingDurationMs,
	startRecording,
	stopRecording,
	cancelRecording,
	setShowFinishDialog,
	isFinishing,
	vocabMode,
	setVocabMode,
}: ControlToolbarProps) {
	const vocabModeLabel =
		vocabMode === "word"
			? "Word mode"
			: vocabMode === "phrase"
				? "Phrase mode"
				: "Vocabulary mode";
	const isRecording = recordingState === "recording";
	const recordingProgress =
		maxRecordingDurationMs > 0
			? Math.min(recordingDurationMs / maxRecordingDurationMs, 1)
			: 0;
	const recordingProgressClass =
		recordingProgress >= 0.9
			? "bg-red-400"
			: recordingProgress >= 0.75
				? "bg-amber-400"
				: "bg-lime-400";

	return (
		<div
			className="bottom-0 mx-auto flex w-fit justify-center overflow-hidden rounded-t-3xl border bg-white transition-all duration-75 ease-in dark:from-surface dark:to-transparent"
			style={{
				boxShadow:
					"rgba(162, 166, 171, 0.2) 0px 0px 0px 0px inset, rgba(162, 166, 171, 0.2) 0px 0px 8px 2px inset",
			}}
		>
			<div className="relative">
				<div className="flex items-center gap-2 p-2.5">
					<DropdownMenu>
						<Tooltip>
							<TooltipTrigger asChild>
								<DropdownMenuTrigger asChild>
									<Button
										type="button"
										variant="ghost"
										size="lg"
										className={cn(
											"rounded-xl px-4",
											vocabMode !== "off" && "text-lime-700",
										)}
									>
										<div className="relative">
											<MousePointer2 className="size-5" />
											{vocabMode === "phrase" ? (
												<Circle className="-right-1 -top-1 absolute size-2.5 fill-current" />
											) : null}
										</div>
									</Button>
								</DropdownMenuTrigger>
							</TooltipTrigger>
							<TooltipContent>{vocabModeLabel}</TooltipContent>
						</Tooltip>
						<DropdownMenuContent side="top" align="center" className="w-56">
							<DropdownMenuLabel>Vocabulary mode</DropdownMenuLabel>
							<DropdownMenuRadioGroup
								value={vocabMode}
								onValueChange={(value) =>
									setVocabMode(value as "off" | "word" | "phrase")
								}
							>
								<DropdownMenuRadioItem value="off">Off</DropdownMenuRadioItem>
								<DropdownMenuRadioItem value="word">
									Word mode
								</DropdownMenuRadioItem>
								<DropdownMenuRadioItem value="phrase">
									Phrase mode
								</DropdownMenuRadioItem>
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="lg"
								className={cn("rounded-xl", showHint && "bg-neutral-100")}
								onClick={() => {
									const next = !showHint;
									setShowHint(next);
									if (next && !hasHint) {
										fetchHintSuggestion();
									}
								}}
								disabled={isLoading}
							>
								<Lightbulb className="size-5" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Get a hint</TooltipContent>
					</Tooltip>
					<div className="flex items-center">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									type="button"
									size="lg"
									variant={isRecording ? "destructive" : "outline"}
									className={cn(
										"flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#C6F64D] bg-radial from-[#EFFF9B] to-[#D8FF76] px-5 py-3",
										isRecording &&
											"animate-pulse border-[#FFBABA] bg-radial from-[#FFE4E4] to-[#FFBABA]",
									)}
									onClick={isRecording ? stopRecording : startRecording}
									disabled={isLoading || recordingState === "transcribing"}
								>
									{recordingState === "transcribing" ? (
										<Loader className="size-5 animate-spin text-lime-700" />
									) : isRecording ? (
										<MicOff className="size-5" />
									) : (
										<Mic className="size-5 text-lime-700" />
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{isRecording
									? `Stop recording (${formatDuration(recordingDurationMs)} / ${formatDuration(maxRecordingDurationMs)})`
									: "Record voice"}
							</TooltipContent>
						</Tooltip>
					</div>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="lg"
								onClick={cancelRecording}
								disabled={recordingState !== "recording"}
								className={cn(
									"rounded-xl",
									recordingState === "recording" &&
										"text-red-500 hover:bg-red-50 hover:text-red-600",
								)}
							>
								<Trash2 className="size-5" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Discard recording</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								className="rounded-xl"
								size="lg"
								onClick={() => setShowFinishDialog(true)}
								disabled={isLoading || isFinishing}
							>
								<CornerDownRight className="size-5" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Finish session</TooltipContent>
					</Tooltip>
				</div>
				{isRecording ? (
					<div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-black/5">
						<div
							className={cn(
								"h-full rounded-full transition-[width,background-color] duration-200 ease-out",
								recordingProgressClass,
							)}
							style={{ width: `${recordingProgress * 100}%` }}
						/>
					</div>
				) : null}
			</div>
		</div>
	);
}
