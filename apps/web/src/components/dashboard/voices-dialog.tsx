import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader, Volume2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";
import { VOICE_OPTIONS } from "@/utils/voice";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

export default function VoicesDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { data: profile, isLoading } = useQuery(
		trpc.profile.get.queryOptions(),
	);
	const updateMutation = useMutation(
		trpc.profile.updateProfile.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.profile.get.queryKey(),
				});
				toast.success("Voice updated");
			},
			onError: () => toast.error("Failed to update voice"),
		}),
	);

	const currentVoice = profile?.voiceModel ?? "aura-2-thalia-en";
	const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const playVoice = (voiceId: string) => {
		if (playingVoiceId === voiceId) return;

		const voice = VOICE_OPTIONS.find((voice) => voice.id === voiceId);
		if (!voice) return;

		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
		}

		const audio = new Audio(voice.voiceUrl);
		audioRef.current = audio;

		audio.addEventListener("ended", () => {
			setPlayingVoiceId(null);
			audioRef.current = null;
		});

		audio.addEventListener("error", () => {
			setPlayingVoiceId(null);
			audioRef.current = null;
		});

		setPlayingVoiceId(voiceId);
		audio.play();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[400px]">
				<DialogHeader>
					<DialogTitle className="font-bold font-lyon text-[1.3rem]">
						Choose AI Voice
					</DialogTitle>
					<DialogDescription>
						Select the voice for AI conversations and pronunciation practice
					</DialogDescription>
				</DialogHeader>
				<div className="grid max-h-[200px] gap-0.5 overflow-y-auto rounded-2xl border border-border/50 bg-muted/50 p-0.5">
					{isLoading ? (
						<div className="py-4 text-center text-muted-foreground text-sm">
							Loading…
						</div>
					) : (
						<RadioGroup
							value={currentVoice}
							onValueChange={(value) =>
								updateMutation.mutate({ voiceModel: value })
							}
							className="space-y-1"
						>
							{VOICE_OPTIONS.map((voice) => {
								const isSelected = currentVoice === voice.id;
								return (
									<Label
										key={voice.id}
										htmlFor={voice.id}
										className={cn(
											"mb-0 flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition-all",
											isSelected
												? "bg-background text-foreground shadow-sm"
												: "border-transparent hover:bg-neutral-100",
										)}
									>
										<div className="flex w-full items-center gap-3">
											<RadioGroupItem value={voice.id} id={voice.id} />
											<div className="flex w-full items-center justify-between">
												<div className="flex items-center gap-1.5">
													<span className="font-medium">{voice.name}</span>
													<button
														disabled={playingVoiceId === voice.id}
														type="button"
														className="cursor-pointer rounded-full text-muted-foreground hover:text-foreground"
														onClick={(e) => {
															e.stopPropagation();
															e.preventDefault();
															playVoice(voice.id);
														}}
													>
														{playingVoiceId === voice.id ? (
															<Loader className="size-4 animate-spin text-muted-foreground" />
														) : (
															<Volume2 className="size-4" />
														)}
													</button>
												</div>
												<div className="text-muted-foreground">
													{voice.accent === "American"
														? "🇺🇸"
														: voice.accent === "British"
															? "🇬🇧"
															: "🇦🇺"}
												</div>
											</div>
										</div>
										{/* {isSelected && (
											<CheckIcon className="size-4 shrink-0 text-lime-600" />
										)} */}
									</Label>
								);
							})}
						</RadioGroup>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
