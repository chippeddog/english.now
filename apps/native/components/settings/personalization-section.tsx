import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SectionHeader } from "@/components/ui/section-header";
import {
	SelectField,
	type SelectOption,
	SelectSheet,
} from "@/components/ui/select-sheet";
import {
	DAILY_GOALS,
	FOCUS_AREAS,
	GOALS,
	INTERESTS,
	LANGUAGES,
} from "@/lib/onboarding-options";
import { showMessage } from "@/lib/toast";
import { queryClient, trpc } from "@/utils/trpc";

type Field =
	| "nativeLanguage"
	| "dailyGoal"
	| "goal"
	| "interests"
	| "focusAreas";

const LANGUAGE_OPTIONS: SelectOption[] = LANGUAGES.map((lang) => ({
	id: lang.id,
	label: lang.name,
	flag: lang.flag,
}));
const DAILY_GOAL_OPTIONS: SelectOption[] = DAILY_GOALS.map((goal) => ({
	id: String(goal.minutes),
	label: `${goal.minutes} min/day - ${goal.label}`,
}));
const GOAL_OPTIONS: SelectOption[] = GOALS.map((goal) => ({
	id: goal.id,
	label: goal.name,
	icon: goal.icon,
}));
const INTEREST_OPTIONS: SelectOption[] = INTERESTS.map((interest) => ({
	id: interest.id,
	label: interest.name,
	icon: interest.icon,
}));
const FOCUS_OPTIONS: SelectOption[] = FOCUS_AREAS.map((area) => ({
	id: area.id,
	label: area.name,
	icon: area.icon,
}));

function labelsFor(options: SelectOption[], ids: string[]) {
	return ids
		.map((id) => options.find((option) => option.id === id)?.label)
		.filter(Boolean)
		.join(", ");
}

export function PersonalizationSection() {
	const { data: profile, isLoading } = useQuery(
		trpc.profile.get.queryOptions(),
	);
	const [openField, setOpenField] = useState<Field | null>(null);

	const updateMutation = useMutation(
		trpc.profile.updateProfile.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.profile.get.queryKey(),
				});
			},
			onError: () => {
				showMessage("Failed to update settings");
			},
		}),
	);

	if (isLoading) {
		return (
			<View className="items-center py-12">
				<ActivityIndicator />
			</View>
		);
	}

	const nativeLanguage = profile?.nativeLanguage ?? "";
	const dailyGoal = String(profile?.dailyGoal ?? 15);
	const goal = profile?.goal ?? "";
	const interests = profile?.interests ?? [];
	const focusAreas = profile?.focusAreas ?? [];

	const sheets: Record<
		Field,
		{
			title: string;
			options: SelectOption[];
			selected: string[];
			multiple?: boolean;
			onSubmit: (next: string[]) => void;
		}
	> = {
		nativeLanguage: {
			title: "Native Language",
			options: LANGUAGE_OPTIONS,
			selected: nativeLanguage ? [nativeLanguage] : [],
			onSubmit: ([value]) =>
				value && updateMutation.mutate({ nativeLanguage: value }),
		},
		dailyGoal: {
			title: "Daily Learning Goal",
			options: DAILY_GOAL_OPTIONS,
			selected: [dailyGoal],
			onSubmit: ([value]) =>
				value && updateMutation.mutate({ dailyGoal: Number(value) }),
		},
		goal: {
			title: "Learning Goal",
			options: GOAL_OPTIONS,
			selected: goal ? [goal] : [],
			onSubmit: ([value]) => value && updateMutation.mutate({ goal: value }),
		},
		interests: {
			title: "Interests",
			options: INTEREST_OPTIONS,
			selected: interests,
			multiple: true,
			onSubmit: (next) => updateMutation.mutate({ interests: next }),
		},
		focusAreas: {
			title: "Focus Areas",
			options: FOCUS_OPTIONS,
			selected: focusAreas,
			multiple: true,
			onSubmit: (next) => {
				if (next.length === 0) {
					showMessage("You need at least one focus area");
					return;
				}
				updateMutation.mutate({ focusAreas: next });
			},
		},
	};

	const activeSheet = openField ? sheets[openField] : null;

	return (
		<View className="gap-4">
			<SectionHeader title="Personalization" />
			<SelectField
				label="Native Language"
				value={labelsFor(
					LANGUAGE_OPTIONS,
					nativeLanguage ? [nativeLanguage] : [],
				)}
				placeholder="Select language"
				onPress={() => setOpenField("nativeLanguage")}
			/>
			<SelectField
				label="Daily Learning Goal"
				value={labelsFor(DAILY_GOAL_OPTIONS, [dailyGoal])}
				placeholder="Select goal"
				onPress={() => setOpenField("dailyGoal")}
			/>
			<SelectField
				label="Learning Goal"
				value={labelsFor(GOAL_OPTIONS, goal ? [goal] : [])}
				placeholder="Select goal"
				onPress={() => setOpenField("goal")}
			/>
			<SelectField
				label="Interests"
				value={labelsFor(INTEREST_OPTIONS, interests)}
				placeholder="Select interests..."
				onPress={() => setOpenField("interests")}
			/>
			<SelectField
				label="Focus Areas"
				value={labelsFor(FOCUS_OPTIONS, focusAreas)}
				placeholder="Select focus areas..."
				onPress={() => setOpenField("focusAreas")}
			/>

			<SelectSheet
				visible={activeSheet !== null}
				title={activeSheet?.title ?? ""}
				options={activeSheet?.options ?? []}
				selected={activeSheet?.selected ?? []}
				multiple={activeSheet?.multiple}
				onClose={() => setOpenField(null)}
				onSubmit={(next) => activeSheet?.onSubmit(next)}
			/>
		</View>
	);
}
