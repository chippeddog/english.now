import {
	changeLanguage,
	fallbackLng,
	languageNames,
	type SupportedLanguage,
	supportedLanguages,
	useTranslation,
} from "@english.now/i18n";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader, Volume2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { cn } from "@/lib/utils";
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
};

export default function ConversationSettingsDrawer({
	open,
	onOpenChange,
	audioDevices,
	selectedDevice,
	setSelectedDevice,
	autoTranslate,
	onAutoTranslateChange,
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
				className="flex h-dvh w-full max-w-sm flex-col gap-0 overflow-hidden rounded-none rounded-l-[28px] border-black/5 p-0 shadow-2xl sm:max-w-md"
				aria-describedby="conversation-settings-description"
			>
				<DrawerHeader className="gap-1.5 border-black/5 border-b px-6 py-5 text-left">
					<DrawerTitle>Settings</DrawerTitle>
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
							<SelectTrigger className="w-full rounded-2xl border-black/5">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
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
							<SelectTrigger className="w-full rounded-2xl border-black/5">
								<SelectValue placeholder="Select language" />
							</SelectTrigger>
							<SelectContent>
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
							<p className="font-medium text-sm">Input device</p>
						</div>
						<div className="space-y-2">
							{audioDevices.length > 0 ? (
								audioDevices.map((device, index) => {
									const isSelected = selectedDevice === device.deviceId;
									return (
										<button
											key={device.deviceId}
											type="button"
											onClick={() => setSelectedDevice(device.deviceId)}
											className={cn(
												"flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors",
												isSelected
													? "border-lime-200 bg-lime-50"
													: "border-black/5 hover:bg-muted/60",
											)}
										>
											<span className="font-medium text-sm">
												{device.label || `Microphone ${index + 1}`}
											</span>
											{isSelected ? (
												<Check className="size-4 text-lime-700" />
											) : null}
										</button>
									);
								})
							) : (
								<p className="rounded-2xl border border-black/10 border-dashed px-4 py-3 text-muted-foreground text-sm">
									No audio devices found.
								</p>
							)}
						</div>
					</section>

					<section className="space-y-3">
						<div>
							<p className="font-medium text-sm">Assistant voice</p>
						</div>
						<div className="space-y-2">
							{VOICE_OPTIONS.map((voice) => {
								const isSelected = currentVoice === voice.id;
								return (
									<div
										key={voice.id}
										className={cn(
											"flex items-center gap-2 rounded-2xl border p-1.5",
											isSelected
												? "border-lime-200 bg-lime-50"
												: "border-black/5",
										)}
									>
										<button
											type="button"
											onClick={() =>
												updateProfile.mutate({ voiceModel: voice.id })
											}
											className="flex min-w-0 flex-1 items-center justify-between rounded-xl px-3 py-2 text-left transition-colors hover:bg-white/70"
										>
											<div className="min-w-0">
												<p className="text-muted-foreground text-xs">
													{voice.flag}
												</p>
												<p className="truncate font-medium text-sm">
													{voice.name}
												</p>
											</div>
											{isSelected ? (
												<Check className="size-4 shrink-0 text-lime-700" />
											) : null}
										</button>
										<button
											type="button"
											disabled={playingVoiceId === voice.id}
											onClick={() => previewVoice(voice.id)}
											className="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-white hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
											aria-label={`Preview ${voice.name}`}
										>
											{playingVoiceId === voice.id ? (
												<Loader className="size-4 animate-spin" />
											) : (
												<Volume2 className="size-4" />
											)}
										</button>
									</div>
								);
							})}
						</div>
					</section>

					<section className="flex items-center justify-between gap-4 rounded-2xl border border-black/5 px-4 py-4">
						<div>
							<p className="font-medium text-sm">Auto-translate</p>
							<p className="mt-1 text-muted-foreground text-xs leading-relaxed">
								Automatically translate finished assistant messages into your
								native language.
							</p>
						</div>
						<Switch
							checked={autoTranslate}
							onCheckedChange={onAutoTranslateChange}
						/>
					</section>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
