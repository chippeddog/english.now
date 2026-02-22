import { Lightbulb, Loader2, Mic, MicOff, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ControlToolbarProps = {
	showHint: boolean;
	setShowHint: (show: boolean) => void;
	hintSuggestions: string[];
	fetchHintSuggestions: () => void;
	isLoading: boolean;
	recordingState: "idle" | "recording" | "transcribing";
	startRecording: () => void;
	stopRecording: () => void;
	setShowFinishDialog: (show: boolean) => void;
	isFinishing: boolean;
};

export function ControlToolbar({
	showHint,
	setShowHint,
	hintSuggestions,
	fetchHintSuggestions,
	isLoading,
	recordingState,
	startRecording,
	stopRecording,
	setShowFinishDialog,
	isFinishing,
}: ControlToolbarProps) {
	return (
		<div
			className="sticky inset-x-0 bottom-5 mx-auto flex justify-center overflow-hidden rounded-t-3xl border bg-white p-3 transition-all duration-75 ease-in dark:from-surface dark:to-transparent"
			style={{
				boxShadow:
					"rgba(162, 166, 171, 0.2) 0px 0px 0px 0px inset, rgba(162, 166, 171, 0.2) 0px 0px 8px 2px inset",
			}}
		>
			<div className="flex gap-2">
				<div className="flex">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="lg"
								className={cn(
									"shrink-0 rounded-xl",
									showHint && "bg-neutral-100",
								)}
								onClick={() => {
									const next = !showHint;
									setShowHint(next);
									if (next && hintSuggestions.length === 0) {
										fetchHintSuggestions();
									}
								}}
								disabled={isLoading}
								title="Get a hint"
							>
								<Lightbulb className={cn("size-5")} />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Get a hint</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								size="lg"
								variant={
									recordingState === "recording" ? "destructive" : "outline"
								}
								className={cn(
									"flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#C6F64D] bg-radial from-[#EFFF9B] to-[#D8FF76]",
									recordingState === "recording" &&
										"animate-pulse border-[#FFBABA] bg-radial from-[#FFE4E4] to-[#FFBABA]",
								)}
								onClick={
									recordingState === "recording"
										? stopRecording
										: startRecording
								}
								disabled={isLoading || recordingState === "transcribing"}
							>
								{recordingState === "transcribing" ? (
									<Loader2 className="size-5 animate-spin" />
								) : recordingState === "recording" ? (
									<MicOff className="size-5" />
								) : (
									<Mic className="size-5" />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{recordingState === "recording"
								? "Stop recording"
								: "Record voice"}
						</TooltipContent>
					</Tooltip>

					<Button
						type="button"
						variant="ghost"
						className="rounded-xl"
						size="lg"
					>
						<Settings className="size-5" />
					</Button>
				</div>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="lg"
							onClick={() => setShowFinishDialog(true)}
							className="shrink-0 cursor-pointer rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
							disabled={isLoading || isFinishing}
						>
							<X className="size-5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Finish session</TooltipContent>
				</Tooltip>
			</div>
		</div>
	);
}
