import {
	changeLanguage,
	fallbackLng,
	languageNames,
	type SupportedLanguage,
	supportedLanguages,
	useTranslation,
} from "@english.now/i18n";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useMemo } from "react";
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
import { useTRPC } from "@/utils/trpc";

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

type PronunciationSettingsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	audioDevices: MediaDeviceInfo[];
	selectedDevice: string;
	setSelectedDevice: (deviceId: string) => void;
};

export default function PronunciationSettingsDrawer({
	open,
	onOpenChange,
	audioDevices,
	selectedDevice,
	setSelectedDevice,
}: PronunciationSettingsDrawerProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { i18n, t } = useTranslation("app");
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
	const inputDeviceValue = useMemo(() => {
		if (!audioDevices.length) return "";
		const valid = audioDevices.some(
			(device) => device.deviceId === selectedDevice,
		);
		return valid ? selectedDevice : (audioDevices[0]?.deviceId ?? "");
	}, [audioDevices, selectedDevice]);

	return (
		<Drawer open={open} onOpenChange={onOpenChange} direction="right">
			<DrawerContent
				className="flex h-dvh w-full max-w-sm flex-col gap-0 overflow-hidden rounded-none rounded-l-3xl border-black/5 p-0 shadow-2xl sm:max-w-md"
				aria-describedby="pronunciation-settings-description"
			>
				<DrawerHeader className="gap-1.5 border-black/5 border-b px-6 py-5 text-left">
					<DrawerTitle className="font-bold font-lyon text-xl">
						{t("settings.title")}
					</DrawerTitle>
					<DrawerClose asChild>
						<button
							type="button"
							className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-700"
							aria-label={t("pronunciation.session.settings.close")}
						>
							<X className="size-4" />
						</button>
					</DrawerClose>
				</DrawerHeader>

				<div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
					<section className="space-y-3">
						<div>
							<Label className="font-medium text-sm">
								{t("pronunciation.session.settings.interfaceLanguage")}
							</Label>
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
							<Label className="font-medium text-sm">
								{t("settings.personalizationSection.nativeLanguage")}
							</Label>
						</div>
						<Select
							value={profile?.nativeLanguage ?? ""}
							disabled={updateProfile.isPending}
							onValueChange={(value) =>
								updateProfile.mutate({ nativeLanguage: value })
							}
						>
							<SelectTrigger className="w-full rounded-xl border-black/5">
								<SelectValue
									placeholder={t(
										"settings.personalizationSection.selectLanguage",
									)}
								/>
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
								{t("pronunciation.session.settings.inputDevice")}
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
									<SelectValue
										placeholder={t(
											"pronunciation.session.settings.selectMicrophone",
										)}
									/>
								</SelectTrigger>
								<SelectContent side="bottom" position="popper">
									{audioDevices.map((device, index) => (
										<SelectItem key={device.deviceId} value={device.deviceId}>
											{device.label ||
												t("pronunciation.session.settings.microphoneLabel", {
													count: index + 1,
												})}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						) : (
							<p className="rounded-2xl border border-black/10 border-dashed px-4 py-3 text-muted-foreground text-sm">
								{t("pronunciation.session.settings.noAudioDevices")}
							</p>
						)}
					</section>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
