import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Check,
	Lightbulb,
	Loader,
	Mic,
	MicOff,
	Settings,
	Trash2,
	Volume2,
	X,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";
import { VOICE_OPTIONS } from "@/utils/voice";

type ControlToolbarProps = {
	showHint: boolean;
	setShowHint: (show: boolean) => void;
	hintSuggestions: string[];
	fetchHintSuggestions: () => void;
	isLoading: boolean;
	recordingState: "idle" | "recording" | "transcribing";
	startRecording: () => void;
	stopRecording: () => void;
	cancelRecording: () => void;
	setShowFinishDialog: (show: boolean) => void;
	isFinishing: boolean;
	audioStream: MediaStream | null;
	settingsOpen: boolean;
	setSettingsOpen: (open: boolean) => void;
	audioDevices: MediaDeviceInfo[];
	selectedDevice: string;
	setSelectedDevice: (deviceId: string) => void;
	autoTranslate: boolean;
	onAutoTranslateChange: (enabled: boolean) => void;
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
	cancelRecording,
	setShowFinishDialog,
	isFinishing,
	settingsOpen,
	setSettingsOpen,
	audioDevices,
	selectedDevice,
	setSelectedDevice,
	autoTranslate,
	onAutoTranslateChange,
}: ControlToolbarProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { data: profile } = useQuery(trpc.profile.get.queryOptions());
	const updateVoice = useMutation(
		trpc.profile.updateProfile.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.profile.get.queryKey(),
				});
			},
		}),
	);

	const currentVoice = profile?.voiceModel ?? "aura-2-asteria-en";
	const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
	const previewAudioRef = useRef<HTMLAudioElement | null>(null);

	const previewVoice = (voiceId: string) => {
		if (playingVoiceId === voiceId) return;
		const voice = VOICE_OPTIONS.find((v) => v.id === voiceId);
		if (!voice) return;

		if (previewAudioRef.current) {
			previewAudioRef.current.pause();
			previewAudioRef.current.currentTime = 0;
		}

		const audio = new Audio(voice.voiceUrl);
		previewAudioRef.current = audio;
		setPlayingVoiceId(voiceId);

		audio.onended = () => {
			setPlayingVoiceId(null);
			previewAudioRef.current = null;
		};
		audio.onerror = () => {
			setPlayingVoiceId(null);
			previewAudioRef.current = null;
		};
		audio.play();
	};

	return (
		<div
			className="sticky inset-x-0 bottom-0 mx-auto flex justify-center overflow-hidden rounded-t-3xl border bg-white transition-all duration-75 ease-in dark:from-surface dark:to-transparent"
			style={{
				boxShadow:
					"rgba(162, 166, 171, 0.2) 0px 0px 0px 0px inset, rgba(162, 166, 171, 0.2) 0px 0px 8px 2px inset",
			}}
		>
			<div className="flex">
				<div className="flex items-center">
					<div className="flex items-center p-2.5">
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
										<Loader className="size-5 animate-spin text-lime-700" />
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
					</div>
					<div className="flex h-full divide-x divide-neutral-200 border-neutral-200 border-r border-l">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									onClick={cancelRecording}
									disabled={recordingState !== "recording"}
									className={cn(
										"aspect-square h-full shrink-0 rounded-none",
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
									className={cn(
										"aspect-square h-full shrink-0 rounded-none",
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
								>
									<Lightbulb className="size-5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Get a hint</TooltipContent>
						</Tooltip>

						<Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
							<Tooltip>
								<TooltipTrigger asChild>
									<PopoverTrigger asChild>
										<Button
											type="button"
											variant="ghost"
											className={cn(
												"aspect-square h-full shrink-0 rounded-none",
												settingsOpen && "bg-neutral-100",
											)}
										>
											<Settings className="size-5" />
										</Button>
									</PopoverTrigger>
								</TooltipTrigger>
								<TooltipContent>Settings</TooltipContent>
							</Tooltip>
							<PopoverContent
								side="top"
								align="center"
								sideOffset={12}
								className="w-72 rounded-xl p-4"
							>
								<div className="flex flex-col gap-4">
									<div className="flex flex-col gap-2">
										<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
											Input device
										</p>
										<div className="flex flex-col gap-0.5">
											{audioDevices.map((device, index) => (
												<button
													key={device.deviceId}
													type="button"
													onClick={() => setSelectedDevice(device.deviceId)}
													className={cn(
														"flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
														selectedDevice === device.deviceId && "bg-muted",
													)}
												>
													<span className="font-medium">
														{device.label || `Microphone ${index + 1}`}
													</span>
													{selectedDevice === device.deviceId && (
														<Check className="size-4 text-primary" />
													)}
												</button>
											))}
											{audioDevices.length === 0 && (
												<p className="px-3 py-2 text-muted-foreground text-sm">
													No audio devices found
												</p>
											)}
										</div>
									</div>

									<div className="h-px bg-border" />

									<div className="flex flex-col gap-2">
										<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
											Assistant voice
										</p>
										<div className="flex flex-col gap-0.5">
											{VOICE_OPTIONS.map((voice) => {
												const isSelected = currentVoice === voice.id;
												return (
													<button
														key={voice.id}
														type="button"
														onClick={() =>
															updateVoice.mutate({ voiceModel: voice.id })
														}
														className={cn(
															"flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
															isSelected && "bg-muted",
														)}
													>
														<div className="flex items-center gap-2">
															<span className="font-medium">{voice.name}</span>
															<span className="text-muted-foreground text-xs">
																{voice.flag}
															</span>
															<button
																type="button"
																disabled={playingVoiceId === voice.id}
																className="rounded-full text-muted-foreground hover:text-foreground"
																onClick={(e) => {
																	e.stopPropagation();
																	previewVoice(voice.id);
																}}
															>
																{playingVoiceId === voice.id ? (
																	<Loader className="size-3.5 animate-spin" />
																) : (
																	<Volume2 className="size-3.5" />
																)}
															</button>
														</div>
														{isSelected && (
															<Check className="size-4 text-primary" />
														)}
													</button>
												);
											})}
										</div>
									</div>

									<div className="h-px bg-border" />

									<div className="flex items-center justify-between">
										<div className="flex flex-col gap-0.5">
											<p className="font-medium text-sm">Auto-translate</p>
											<p className="text-muted-foreground text-xs">
												Translate messages to your native language
											</p>
										</div>
										<Switch
											checked={autoTranslate}
											onCheckedChange={onAutoTranslateChange}
										/>
									</div>
								</div>
							</PopoverContent>
						</Popover>
					</div>
				</div>
				<div className="flex items-center p-2.5">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								size="lg"
								onClick={() => setShowFinishDialog(true)}
								className={cn(
									"flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-red-600 bg-radial from-[#e28b8b] to-[#EF4444] text-red-800 hover:text-red-700/80",
								)}
								disabled={isLoading || isFinishing}
							>
								<X className="size-5" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Finish session</TooltipContent>
					</Tooltip>
				</div>
			</div>
		</div>
	);
}
