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
import { useState } from "react";
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

const LANGUAGES = [
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
];

const DAILY_GOALS = [
	{ minutes: 5, label: "Casual", description: "5 min/day" },
	{ minutes: 10, label: "Steady", description: "10 min/day" },
	{ minutes: 15, label: "Serious", description: "15 min/day" },
	{ minutes: 20, label: "Intensive", description: "20+ min/day" },
];

const GOALS: { id: string; name: string; icon: LucideIcon }[] = [
	{ id: "career", name: "Career Growth", icon: Briefcase },
	{ id: "travel", name: "Travel", icon: Plane },
	{ id: "education", name: "Education", icon: GraduationCap },
	{ id: "social", name: "Social", icon: Users },
	{ id: "personal", name: "Personal Growth", icon: Target },
	{ id: "content", name: "Entertainment", icon: BookOpen },
];

const FOCUS_AREAS: { id: string; name: string; icon: LucideIcon }[] = [
	{ id: "speaking", name: "Speaking", icon: MessageCircle },
	{ id: "vocabulary", name: "Vocabulary", icon: BookOpen },
	{ id: "grammar", name: "Grammar", icon: GraduationCap },
	{ id: "pronunciation", name: "Pronunciation", icon: Zap },
];

const INTERESTS: { id: string; name: string; icon: LucideIcon }[] = [
	{ id: "technology", name: "Technology", icon: Cpu },
	{ id: "travel", name: "Travel", icon: Plane },
	{ id: "music", name: "Music", icon: Music },
	{ id: "movies", name: "Movies & TV", icon: Clapperboard },
	{ id: "food", name: "Food & Cooking", icon: UtensilsCrossed },
	{ id: "fitness", name: "Health & Fitness", icon: Dumbbell },
	{ id: "business", name: "Business", icon: Briefcase },
	{ id: "art", name: "Art & Design", icon: Palette },
	{ id: "gaming", name: "Gaming", icon: Gamepad2 },
	{ id: "books", name: "Books & Literature", icon: BookOpen },
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
	options: { id: string; name: string; icon: LucideIcon }[];
	selected: string[];
	onChange: (next: string[]) => void;
}) {
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
			<Label className="font-medium text-muted-foreground text-sm">
				{label}
			</Label>
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
										{opt.name}
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
								<span>{option.name}</span>
							</button>
						);
					})}
				</PopoverContent>
			</Popover>
		</div>
	);
}

export const Personalization = () => {
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
				toast.success("Settings updated");
			},
			onError: () => {
				toast.error("Failed to update settings");
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
		<div className="space-y-8">
			<div className="grid grid-cols-3 gap-5">
				<div className="col-span-1 space-y-2">
					<div className="space-y-1">
						<Label className="font-medium text-muted-foreground text-sm">
							Native Language
						</Label>
					</div>
					<Select
						value={profile?.nativeLanguage ?? ""}
						onValueChange={(value) => update("nativeLanguage", value)}
					>
						<SelectTrigger className="w-full max-w-md">
							<SelectValue placeholder="Select language" />
						</SelectTrigger>
						<SelectContent>
							{LANGUAGES.map((lang) => (
								<SelectItem key={lang.id} value={lang.id}>
									<span className="flex items-center gap-2">
										<span>{lang.flag}</span>
										<span>{lang.name}</span>
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="col-span-1 space-y-2">
					<div className="space-y-1">
						<Label className="font-medium text-muted-foreground text-sm">
							Daily Learning Goal
						</Label>
					</div>
					<Select
						value={String(profile?.dailyGoal ?? 15)}
						onValueChange={(value) => update("dailyGoal", Number(value))}
					>
						<SelectTrigger className="w-full max-w-md">
							<SelectValue placeholder="Select goal" />
						</SelectTrigger>
						<SelectContent>
							{DAILY_GOALS.map((goal) => (
								<SelectItem key={goal.minutes} value={String(goal.minutes)}>
									{goal.minutes} min - {goal.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="col-span-1 space-y-3">
					<div className="space-y-1">
						<Label className="font-medium text-muted-foreground text-sm">
							Learning Goal
						</Label>
					</div>

					<Select
						value={profile?.goal ?? ""}
						onValueChange={(value) => update("goal", value)}
					>
						<SelectTrigger className="w-full max-w-md">
							<SelectValue placeholder="Select goal" />
						</SelectTrigger>
						<SelectContent>
							{GOALS.map((goal) => (
								<SelectItem key={goal.id} value={goal.id}>
									<span className="flex items-center gap-2">
										<goal.icon className="size-4" />
										{goal.name}
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-5">
				<MultiSelect
					label="Interests"
					placeholder="Select interests..."
					options={INTERESTS}
					selected={profile?.interests ?? []}
					onChange={(next) => update("interests", next)}
				/>

				<MultiSelect
					label="Focus Areas"
					placeholder="Select focus areas..."
					options={FOCUS_AREAS}
					selected={profile?.focusAreas ?? []}
					onChange={(next) => {
						if (next.length === 0) {
							toast.error("You need at least one focus area");
							return;
						}
						update("focusAreas", next);
					}}
				/>
			</div>
		</div>
	);
};
