import type { SupportedLanguage } from "@english.now/i18n";
import { useTranslation } from "@english.now/i18n";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
	BookOpen,
	Briefcase,
	Check,
	ChevronDown,
	Clapperboard,
	Cpu,
	Dumbbell,
	Gamepad2,
	GraduationCap,
	Loader,
	MessageCircle,
	Music,
	Palette,
	Plane,
	Target,
	Users,
	UtensilsCrossed,
	X,
	Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

type SelectableOption = {
	id: string;
	labelKey: string;
	icon: LucideIcon;
};

const LANGUAGES = [
	{ id: "uk", flag: "🇺🇦" },
	{ id: "en", flag: "🇬🇧" },
	{ id: "fr", flag: "🇫🇷" },
	{ id: "es", flag: "🇪🇸" },
	{ id: "de", flag: "🇩🇪" },
	{ id: "pt", flag: "🇵🇹" },
	{ id: "it", flag: "🇮🇹" },
	{ id: "pl", flag: "🇵🇱" },
	{ id: "ja", flag: "🇯🇵" },
	{ id: "ko", flag: "🇰🇷" },
	{ id: "zh", flag: "🇨🇳" },
	{ id: "ar", flag: "🇸🇦" },
	{ id: "hi", flag: "🇮🇳" },
	{ id: "tr", flag: "🇹🇷" },
] as const satisfies ReadonlyArray<{ id: SupportedLanguage; flag: string }>;

const DAILY_GOALS = [
	{ minutes: 5, labelKey: "settings.personalizationSection.dailyGoals.casual" },
	{
		minutes: 10,
		labelKey: "settings.personalizationSection.dailyGoals.steady",
	},
	{
		minutes: 15,
		labelKey: "settings.personalizationSection.dailyGoals.serious",
	},
	{
		minutes: 20,
		labelKey: "settings.personalizationSection.dailyGoals.intensive",
	},
];

const GOALS: SelectableOption[] = [
	{
		id: "career",
		labelKey: "settings.personalizationSection.goals.career",
		icon: Briefcase,
	},
	{
		id: "travel",
		labelKey: "settings.personalizationSection.goals.travel",
		icon: Plane,
	},
	{
		id: "education",
		labelKey: "settings.personalizationSection.goals.education",
		icon: GraduationCap,
	},
	{
		id: "social",
		labelKey: "settings.personalizationSection.goals.social",
		icon: Users,
	},
	{
		id: "personal",
		labelKey: "settings.personalizationSection.goals.personal",
		icon: Target,
	},
	{
		id: "content",
		labelKey: "settings.personalizationSection.goals.content",
		icon: BookOpen,
	},
];

const FOCUS_AREAS: SelectableOption[] = [
	{
		id: "speaking",
		labelKey: "settings.personalizationSection.focusAreas.speaking",
		icon: MessageCircle,
	},
	{
		id: "vocabulary",
		labelKey: "settings.personalizationSection.focusAreas.vocabulary",
		icon: BookOpen,
	},
	{
		id: "grammar",
		labelKey: "settings.personalizationSection.focusAreas.grammar",
		icon: GraduationCap,
	},
	{
		id: "pronunciation",
		labelKey: "settings.personalizationSection.focusAreas.pronunciation",
		icon: Zap,
	},
];

const INTERESTS: SelectableOption[] = [
	{
		id: "technology",
		labelKey: "settings.personalizationSection.interests.technology",
		icon: Cpu,
	},
	{
		id: "travel",
		labelKey: "settings.personalizationSection.interests.travel",
		icon: Plane,
	},
	{
		id: "music",
		labelKey: "settings.personalizationSection.interests.music",
		icon: Music,
	},
	{
		id: "movies",
		labelKey: "settings.personalizationSection.interests.movies",
		icon: Clapperboard,
	},
	{
		id: "food",
		labelKey: "settings.personalizationSection.interests.food",
		icon: UtensilsCrossed,
	},
	{
		id: "fitness",
		labelKey: "settings.personalizationSection.interests.fitness",
		icon: Dumbbell,
	},
	{
		id: "business",
		labelKey: "settings.personalizationSection.interests.business",
		icon: Briefcase,
	},
	{
		id: "art",
		labelKey: "settings.personalizationSection.interests.art",
		icon: Palette,
	},
	{
		id: "gaming",
		labelKey: "settings.personalizationSection.interests.gaming",
		icon: Gamepad2,
	},
	{
		id: "books",
		labelKey: "settings.personalizationSection.interests.books",
		icon: BookOpen,
	},
];

function MultiSelect({
	label,
	placeholder,
	options,
	selected,
	onChange,
}: {
	label: string;
	placeholder: string;
	options: SelectableOption[];
	selected: string[];
	onChange: (next: string[]) => void;
}) {
	const { t } = useTranslation("app");
	const [open, setOpen] = useState(false);

	const toggle = (id: string) => {
		onChange(
			selected.includes(id)
				? selected.filter((s) => s !== id)
				: [...selected, id],
		);
	};

	const remove = (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		onChange(selected.filter((s) => s !== id));
	};

	return (
		<div className="space-y-2">
			<Label className="font-medium">{label}</Label>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<button
						type="button"
						className="flex min-h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-2 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
					>
						<div className="flex flex-1 flex-wrap items-center gap-1.5">
							{selected.length === 0 && (
								<span className="text-muted-foreground">{placeholder}</span>
							)}
							{selected.map((id) => {
								const opt = options.find((o) => o.id === id);
								if (!opt) return null;
								return (
									<Badge key={id} variant="secondary" className="gap-1 pr-1">
										<opt.icon className="size-3" />
										{t(opt.labelKey)}
										<button
											type="button"
											className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
											onClick={(e) => remove(id, e)}
										>
											<X className="size-3" />
										</button>
									</Badge>
								);
							})}
						</div>
						<ChevronDown className="size-4 shrink-0 opacity-50" />
					</button>
				</PopoverTrigger>
				<PopoverContent
					className="w-(--radix-popover-trigger-width) p-1"
					align="start"
				>
					{options.map((option) => {
						const isSelected = selected.includes(option.id);
						return (
							<button
								key={option.id}
								type="button"
								onClick={() => toggle(option.id)}
								className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
							>
								<div
									className={cn(
										"flex size-4 items-center justify-center rounded-sm border",
										isSelected
											? "border-lime-500 bg-lime-500 text-white"
											: "border-muted-foreground/30",
									)}
								>
									{isSelected && <Check className="size-3" />}
								</div>
								<option.icon className="size-4 text-muted-foreground" />
								<span>{t(option.labelKey)}</span>
							</button>
						);
					})}
				</PopoverContent>
			</Popover>
		</div>
	);
}

export const Personalization = () => {
	const { i18n, t } = useTranslation("app");
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const languageFormatter = useMemo(
		() =>
			typeof Intl.DisplayNames === "function"
				? new Intl.DisplayNames(
						[i18n.resolvedLanguage || i18n.language || "en"],
						{
							type: "language",
						},
					)
				: null,
		[i18n.language, i18n.resolvedLanguage],
	);

	const { data: profile, isLoading } = useQuery(
		trpc.profile.get.queryOptions(),
	);

	const updateMutation = useMutation(
		trpc.profile.updateProfile.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.profile.get.queryKey(),
				});
				toast.success(t("settings.personalizationSection.toasts.updated"));
			},
			onError: () => {
				toast.error(t("settings.personalizationSection.toasts.updateError"));
			},
		}),
	);

	const update = (field: string, value: unknown) => {
		updateMutation.mutate({ [field]: value });
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-5">
			<h2 className="font-semibold">{t("settings.personalization")}</h2>
			<div className="grid grid-cols-1 gap-5 md:grid-cols-3">
				<div className="col-span-1 space-y-2">
					<Label>{t("settings.personalizationSection.nativeLanguage")}</Label>
					<Select
						value={profile?.nativeLanguage ?? ""}
						onValueChange={(value) => update("nativeLanguage", value)}
					>
						<SelectTrigger className="w-full max-w-md">
							<SelectValue
								placeholder={t(
									"settings.personalizationSection.selectLanguage",
								)}
							/>
						</SelectTrigger>
						<SelectContent>
							{LANGUAGES.map((lang) => (
								<SelectItem key={lang.id} value={lang.id}>
									<span className="flex items-center gap-2">
										<span>{lang.flag}</span>
										<span>
											{languageFormatter?.of(lang.id) ?? lang.id.toUpperCase()}
										</span>
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="col-span-1 space-y-2">
					<div className="space-y-1">
						<Label>
							{t("settings.personalizationSection.dailyLearningGoal")}
						</Label>
					</div>
					<Select
						value={String(profile?.dailyGoal ?? 15)}
						onValueChange={(value) => update("dailyGoal", Number(value))}
					>
						<SelectTrigger className="w-full max-w-md">
							<SelectValue
								placeholder={t("settings.personalizationSection.selectGoal")}
							/>
						</SelectTrigger>
						<SelectContent>
							{DAILY_GOALS.map((goal) => (
								<SelectItem key={goal.minutes} value={String(goal.minutes)}>
									{t("settings.personalizationSection.dailyGoals.option", {
										minutes: goal.minutes,
										label: t(goal.labelKey),
									})}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="col-span-1 space-y-3">
					<div className="space-y-1">
						<Label>{t("settings.personalizationSection.learningGoal")}</Label>
					</div>

					<Select
						value={profile?.goal ?? ""}
						onValueChange={(value) => update("goal", value)}
					>
						<SelectTrigger className="w-full max-w-md">
							<SelectValue
								placeholder={t("settings.personalizationSection.selectGoal")}
							/>
						</SelectTrigger>
						<SelectContent>
							{GOALS.map((goal) => (
								<SelectItem key={goal.id} value={goal.id}>
									<span className="flex items-center gap-2">
										<goal.icon className="size-4" />
										{t(goal.labelKey)}
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
				<MultiSelect
					label={t("settings.personalizationSection.interestsLabel")}
					placeholder={t("settings.personalizationSection.selectInterests")}
					options={INTERESTS}
					selected={profile?.interests ?? []}
					onChange={(next) => update("interests", next)}
				/>

				<MultiSelect
					label={t("settings.personalizationSection.focusAreasLabel")}
					placeholder={t("settings.personalizationSection.selectFocusAreas")}
					options={FOCUS_AREAS}
					selected={profile?.focusAreas ?? []}
					onChange={(next) => {
						if (next.length === 0) {
							toast.error(
								t("settings.personalizationSection.toasts.focusAreaRequired"),
							);
							return;
						}
						update("focusAreas", next);
					}}
				/>
			</div>
		</div>
	);
};
