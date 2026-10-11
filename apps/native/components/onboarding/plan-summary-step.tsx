import { Text, View } from "react-native";
import {
	FOCUS_AREAS,
	GOALS,
	INTERESTS,
	LEVELS,
	type OnboardingData,
} from "@/lib/onboarding-options";
import { elevatedCardShadow } from "./card-shadow";
import { ContinueButton } from "./continue-button";
import { StepLayout } from "./step-layout";

type PlanSummaryStepProps = {
	data: OnboardingData;
	onSubmit: () => void;
	isSubmitting: boolean;
	error: string | null;
};

export function PlanSummaryStep({
	data,
	onSubmit,
	isSubmitting,
	error,
}: PlanSummaryStepProps) {
	const levelName = LEVELS.find((l) => l.id === data.level)?.name || "Beginner";
	const goalName = GOALS.find((g) => g.id === data.goal)?.name || "Learning";
	const timeMinutes = data.time || "15";
	const focusNames = data.focus
		.map((f) => FOCUS_AREAS.find((a) => a.id === f)?.name)
		.filter(Boolean);
	const interestNames = data.interests
		.map((i) => INTERESTS.find((a) => a.id === i)?.name)
		.filter(Boolean);

	const rows = [
		{ label: "Current Level", value: levelName },
		{ label: "Main Goal", value: goalName },
		{ label: "Daily Practice", value: `${timeMinutes} minutes` },
		{ label: "Focus Areas", value: focusNames.join(", ") || "All" },
		{ label: "Interests", value: interestNames.join(", ") || "—" },
	];

	return (
		<StepLayout
			centered
			title="Your Personal Plan is Ready!"
			subtitle="Based on your preferences, we've created a custom learning path"
			footer={
				<View className="gap-3">
					{error ? (
						<Text className="text-center text-red-600 text-sm">{error}</Text>
					) : null}
					<ContinueButton
						label="Start Learning"
						onPress={onSubmit}
						isLoading={isSubmitting}
					/>
				</View>
			}
		>
			<View className="rounded-3xl bg-white p-6" style={elevatedCardShadow}>
				<Text className="mb-4 font-bold text-2xl text-neutral-900 tracking-tight">
					Your Learning Profile
				</Text>
				{rows.map((row, index) => (
					<View
						key={row.label}
						className={`flex-row items-start justify-between gap-4 py-3 ${index < rows.length - 1 ? "border-neutral-200 border-b border-dashed" : ""}`}
					>
						<Text className="text-base text-neutral-500">{row.label}</Text>
						<Text className="max-w-[60%] text-right font-medium text-base text-neutral-900">
							{row.value}
						</Text>
					</View>
				))}
			</View>
		</StepLayout>
	);
}
