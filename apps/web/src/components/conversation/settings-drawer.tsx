import {
	changeLanguage,
	fallbackLng,
	languageNames,
	type SupportedLanguage,
	supportedLanguages,
	useTranslation,
} from "@english.now/i18n";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader, Volume2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTRPC } from "@/utils/trpc";
import { VOICE_OPTIONS } from "@/utils/voice";

const NATIVE_LANGUAGES = [
	{ id: "uk", name: "Ukrainian", flag: "🇺🇦" },
	{ id: "en", name: "English", flag: "🇬🇧" },
	{ id: "fr", name: "French", flag: "🇫🇷" },
	{ id: "es", name: "Spanish", flag: "🇪🇸" },
	{ id: "de", name: "German", flag: "🇩🇪" },
	{ id: "pt", name: "Portuguese", flag: "🇵🇹" },
	{ id: "it", name: "Italian", flag: "🇮🇹" },
	{ id: "pl", name: "Polish", flag: "🇵🇱" },
	{ id: "ja", name: "Japanese", flag: "🇯🇵" },
	{ id: "ko", name: "Korean", flag: "🇰🇷" },
	{ id: "zh", name: "Chinese", flag: "🇨🇳" },
	{ id: "ar", name: "Arabic", flag: "🇸🇦" },
	{ id: "hi", name: "Hindi", flag: "🇮🇳" },
	{ id: "tr", name: "Turkish", flag: "🇹🇷" },
] as const;

type ConversationSettingsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	audioDevices: MediaDeviceInfo[];
	selectedDevice: string;
	setSelectedDevice: (deviceId: string) => void;
	autoTranslate: boolean;
	onAutoTranslateChange: (enabled: boolean) => void;
	autoPlay: boolean;
	onAutoPlayChange: (enabled: boolean) => void;
};

export default function ConversationSettingsDrawer({
	open,
	onOpenChange,
	audioDevices,
	selectedDevice,
	setSelectedDevice,
	autoTranslate,
	onAutoTranslateChange,
	autoPlay,
	onAutoPlayChange,
}: ConversationSettingsDrawerProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { i18n } = useTranslation();
	const { data: profile } = useQuery(trpc.profile.get.queryOptions());
	const updateProfile = useMutation(
		trpc.profile.updateProfile.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.profile.get.queryKey(),
				});
			},
		}),
	);

	const rawInterfaceLang = i18n.resolvedLanguage || i18n.language;
	const interfaceLang = (
		supportedLanguages.includes(rawInterfaceLang as SupportedLanguage)
			? rawInterfaceLang
			: fallbackLng
	) as SupportedLanguage;
	const currentVoice = profile?.voiceModel ?? "aura-2-asteria-en";
	const voiceSelectValue = useMemo(() => {
		const match = VOICE_OPTIONS.find((v) => v.id === currentVoice);
		return match?.id ?? VOICE_OPTIONS[0]?.id ?? currentVoice;
	}, [currentVoice]);
	const inputDeviceValue = useMemo(() => {
		if (!audioDevices.length) return "";
		const valid = audioDevices.some((d) => d.deviceId === selectedDevice);
		return valid ? selectedDevice : audioDevices[0].deviceId;
	}, [audioDevices, selectedDevice]);
	const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
	const previewAudioRef = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		return () => {
			if (previewAudioRef.current) {
				previewAudioRef.current.pause();
				previewAudioRef.current = null;
			}
		};
	}, []);

	useEffect(() => {
		if (!open && previewAudioRef.current) {
			previewAudioRef.current.pause();
			previewAudioRef.current.currentTime = 0;
			previewAudioRef.current = null;
			setPlayingVoiceId(null);
		}
	}, [open]);

	const previewVoice = (voiceId: string) => {
		if (playingVoiceId === voiceId) return;
		const voice = VOICE_OPTIONS.find((option) => option.id === voiceId);
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
		<Drawer open={open} onOpenChange={onOpenChange} direction="right">
			<DrawerContent
				className="flex h-dvh w-full max-w-sm flex-col gap-0 overflow-hidden rounded-none rounded-l-3xl border-black/5 p-0 shadow-2xl sm:max-w-md"
				aria-describedby="conversation-settings-description"
			>
				<DrawerHeader className="gap-1.5 border-black/5 border-b px-6 py-5 text-left">
					<DrawerTitle className="font-bold font-lyon text-xl">
						Settings
					</DrawerTitle>
					<DrawerClose asChild>
						<button
							type="button"
							className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-700"
							aria-label="Close settings"
						>
							<X className="size-4" />
						</button>
					</DrawerClose>
				</DrawerHeader>

				<div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
					<section className="space-y-3">
						<div>
							<Label className="font-medium text-sm">Interface language</Label>
						</div>
						<Select
							value={interfaceLang}
							onValueChange={(value) => {
								void changeLanguage(value as SupportedLanguage);
							}}
						>
							<SelectTrigger className="w-full rounded-xl border-black/5">
								<SelectValue />
							</SelectTrigger>
							<SelectContent side="bottom" position="popper">
								{supportedLanguages.map((code) => (
									<SelectItem key={code} value={code}>
										{languageNames[code]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</section>

					<section className="space-y-3">
						<div>
							<Label className="font-medium text-sm">Native language</Label>
						</div>
						<Select
							value={profile?.nativeLanguage ?? ""}
							disabled={updateProfile.isPending}
							onValueChange={(value) =>
								updateProfile.mutate({ nativeLanguage: value })
							}
						>
							<SelectTrigger className="w-full rounded-xl border-black/5">
								<SelectValue placeholder="Select language" />
							</SelectTrigger>
							<SelectContent side="bottom" position="popper">
								{NATIVE_LANGUAGES.map((lang) => (
									<SelectItem key={lang.id} value={lang.id}>
										<span className="flex items-center gap-2">
											<span>{lang.flag}</span>
											<span>{lang.name}</span>
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</section>

					<section className="space-y-3">
						<div>
							<Label className="font-medium text-sm" htmlFor="input-device">
								Input device
							</Label>
						</div>
						{audioDevices.length > 0 ? (
							<Select
								value={inputDeviceValue}
								onValueChange={(deviceId) => setSelectedDevice(deviceId)}
							>
								<SelectTrigger
									id="input-device"
									className="h-auto w-full rounded-xl border-black/5 py-2.5 text-left [&>span]:line-clamp-2"
								>
									<SelectValue placeholder="Select microphone" />
								</SelectTrigger>
								<SelectContent side="bottom" position="popper">
									{audioDevices.map((device, index) => (
										<SelectItem key={device.deviceId} value={device.deviceId}>
											{device.label || `Microphone ${index + 1}`}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						) : (
							<p className="rounded-2xl border border-black/10 border-dashed px-4 py-3 text-muted-foreground text-sm">
								No audio devices found. Open settings again after allowing
								microphone access.
							</p>
						)}
					</section>

					<section className="space-y-3">
						<div>
							<Label className="font-medium text-sm" htmlFor="assistant-voice">
								Assistant voice
							</Label>
						</div>
						<div className="flex items-stretch gap-2">
							<Select
								value={voiceSelectValue}
								disabled={updateProfile.isPending}
								onValueChange={(voiceId) =>
									updateProfile.mutate({ voiceModel: voiceId })
								}
							>
								<SelectTrigger
									id="assistant-voice"
									className="h-auto min-w-0 flex-1 rounded-xl border-black/5 py-2.5 text-left"
								>
									<SelectValue placeholder="Select a voice" />
								</SelectTrigger>
								<SelectContent side="bottom" position="popper">
									{VOICE_OPTIONS.map((voice) => (
										<SelectItem key={voice.id} value={voice.id}>
											<span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
												<span aria-hidden>{voice.flag}</span>
												<span className="font-medium">{voice.name}</span>
												<span className="text-muted-foreground text-xs">
													{voice.accent}
												</span>
											</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button
								type="button"
								variant="outline"
								size="icon"
								disabled={
									updateProfile.isPending || playingVoiceId === voiceSelectValue
								}
								onClick={() => previewVoice(voiceSelectValue)}
								className="shrink-0 rounded-xl border-black/5"
								aria-label={`Preview ${VOICE_OPTIONS.find((v) => v.id === voiceSelectValue)?.name ?? "voice"}`}
							>
								{playingVoiceId === voiceSelectValue ? (
									<Loader className="size-4 animate-spin" />
								) : (
									<Volume2 className="size-4" />
								)}
							</Button>
						</div>
					</section>
					<hr className="my-5 border-neutral-200 border-dashed" />
					<section className="flex items-center justify-between">
						<div>
							<p className="font-medium text-sm">Auto-translate</p>
						</div>
						<Switch
							checked={autoTranslate}
							onCheckedChange={onAutoTranslateChange}
						/>
					</section>
					<section className="flex items-center justify-between">
						<div>
							<p className="font-medium text-sm">Auto-play audio</p>
						</div>
						<Switch checked={autoPlay} onCheckedChange={onAutoPlayChange} />
					</section>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
